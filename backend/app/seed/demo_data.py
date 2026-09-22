import os
import cv2
import numpy as np
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.ward import Ward, Road, Contractor
from app.models.case import Case, CaseLocation
from app.models.work_order import WorkOrder
from app.models.evidence import EvidenceFile
from app.models.verification import VerificationResult, VerificationCheck
from app.models.audit import AuditLog, EngineerWardAssignment
from app.services.audit_service import log_audit_event


# Demo-only credentials. Never reuse these outside local/demo environments.
DEMO_PASSWORDS = {
    "citizen": "Citizen@123",
    "contractor": "Contractor@123",
    "engineer": "Engineer@123",
    "admin": "Admin@123",
}


def create_synthetic_demo_images(base_dir: str):
    """
    Creates synthetic pothole BEFORE & AFTER image pairs with distinctive road textures,
    peripheral curb landmarks, and dark cavity vs smooth asphalt patch.
    """
    img_dir = os.path.join(base_dir, "uploads", "demo")
    os.makedirs(img_dir, exist_ok=True)

    h, w = 600, 800

    # 1. Base Road Scene (shared street with asphalt, yellow road lines, and curb)
    base_scene = np.ones((h, w, 3), dtype=np.uint8) * 60  # dark gray asphalt
    # Add road noise
    noise = np.random.randint(-15, 15, (h, w, 3), dtype=np.int16)
    base_scene = np.clip(base_scene.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Top curb / sidewalk landmark
    cv2.rectangle(base_scene, (0, 0), (w, 120), (140, 140, 145), -1)
    cv2.line(base_scene, (0, 120), (w, 120), (40, 40, 40), 4)

    # Yellow lane divider landmark
    for x in range(20, w, 140):
        cv2.rectangle(base_scene, (x, 150), (x + 80, 165), (30, 210, 240), -1)

    # Street lamp pole landmark on right
    cv2.rectangle(base_scene, (720, 20), (745, 260), (180, 180, 180), -1)
    cv2.circle(base_scene, (732, 25), 22, (220, 230, 240), -1)

    # BEFORE IMAGE: Deep irregular crater pothole in bottom center
    before_img = base_scene.copy()
    center = (420, 410)
    # Dark cavity
    cv2.ellipse(before_img, center, (120, 75), 15, 0, 360, (20, 18, 15), -1)
    # Jagged inner edges
    cv2.ellipse(before_img, (415, 415), (95, 55), 10, 0, 360, (10, 8, 5), -1)
    cv2.ellipse(before_img, center, (125, 80), 15, 0, 360, (90, 85, 80), 3)

    # AFTER IMAGE (VERIFIED): Cavity filled with fresh black asphalt patch & smoothed surface
    after_verified_img = base_scene.copy()
    # Leveled fresh bitumen patch matching road elevation
    cv2.ellipse(after_verified_img, center, (130, 82), 15, 0, 360, (62, 60, 60), -1)
    # Tamped edge seam
    cv2.ellipse(after_verified_img, center, (132, 84), 15, 0, 360, (55, 55, 55), 2)

    # AFTER IMAGE (UNREPAIRED / FAILED): Cavity still wide open
    after_unrepaired_img = before_img.copy()

    # Save images to disk
    before_path = os.path.join(img_dir, "pothole_before_demo.jpg")
    after_verified_path = os.path.join(img_dir, "pothole_after_verified_demo.jpg")
    after_unrepaired_path = os.path.join(img_dir, "pothole_after_unrepaired_demo.jpg")

    cv2.imwrite(before_path, before_img)
    cv2.imwrite(after_verified_path, after_verified_img)
    cv2.imwrite(after_unrepaired_path, after_unrepaired_img)

    return {
        "before": "uploads/demo/pothole_before_demo.jpg",
        "after_verified": "uploads/demo/pothole_after_verified_demo.jpg",
        "after_unrepaired": "uploads/demo/pothole_after_unrepaired_demo.jpg",
    }


def seed_database(db: Session):
    """
    Seeds initial municipal wards, roads, contractors, demo users, cases, and work orders.
    """
    # Ensure all demo users exist even if DB was previously created
    for u_data in [
        ("citizen@civicfix.org", "Aarav Sharma", UserRole.CITIZEN, "+91 98200 12345", DEMO_PASSWORDS["citizen"], None, None),
        ("contractor@roadworks.in", "RoadWorks Unit A", UserRole.CONTRACTOR, "+91 98201 67890", DEMO_PASSWORDS["contractor"], None, "CONT-ROAD-01"),
        ("engineer@mcgm.gov.in", "Er. Rajesh Kulkarni", UserRole.WARD_ENGINEER, "+91 98202 34567", DEMO_PASSWORDS["engineer"], "BMC-ENG-4001", None),
        ("admin@civicfix.org", "CivicFix Admin", UserRole.ADMIN, "+91 98203 98765", DEMO_PASSWORDS["admin"], "BMC-ADM-1001", None),
        ("citizen@civicfix.ai", "Aarav Sharma (AI)", UserRole.CITIZEN, "+91 98200 12345", DEMO_PASSWORDS["citizen"], None, None),
        ("contractor@civicfix.ai", "RoadWorks Unit A (AI)", UserRole.CONTRACTOR, "+91 98201 67890", DEMO_PASSWORDS["contractor"], None, "CONT-ROAD-01"),
        ("engineer@civicfix.ai", "Er. Rajesh Kulkarni (AI)", UserRole.WARD_ENGINEER, "+91 98202 34567", DEMO_PASSWORDS["engineer"], "BMC-ENG-4001", None),
        ("admin@civicfix.ai", "CivicFix Admin (AI)", UserRole.ADMIN, "+91 98203 98765", DEMO_PASSWORDS["admin"], "BMC-ADM-1001", None),
    ]:
        existing = db.query(User).filter(User.email == u_data[0]).first()
        if not existing:
            db.add(User(
                email=u_data[0],
                full_name=u_data[1],
                role=u_data[2],
                phone=u_data[3],
                hashed_password=hash_password(u_data[4]),
                employee_id=u_data[5],
                contractor_id=u_data[6],
                is_active=True
            ))
        else:
            if not existing.hashed_password:
                existing.hashed_password = hash_password(u_data[4])
            if u_data[5] and not existing.employee_id:
                existing.employee_id = u_data[5]
            if u_data[6] and not existing.contractor_id:
                existing.contractor_id = u_data[6]
    db.commit()

    # Seed Engineer Ward Assignment History if missing
    for assign_data in [
        {
            "employee_id": "BMC-ENG-4001",
            "engineer_name": "Er. Rajesh Kulkarni",
            "engineer_email": "engineer@mcgm.gov.in",
            "ward_id": "G/N",
            "ward_name": "Ward G/N — Dadar / Mahim / Dharavi",
            "assigned_by": "Municipal Commissioner Office (Ref: MCGM/RD/2026/G-N-04)",
            "is_current": True,
            "start_date": datetime(2026, 1, 1),
            "notes": "Official jurisdictional assignment for Ward G/N Road Maintenance",
        },
        {
            "employee_id": "BMC-ENG-4001",
            "engineer_name": "Er. Rajesh Kulkarni",
            "engineer_email": "engineer@mcgm.gov.in",
            "ward_id": "F/N",
            "ward_name": "Ward F/N — Matunga / Sion / Wadala",
            "assigned_by": "Municipal Commissioner Office (Ref: MCGM/RD/2025/F-N-12)",
            "is_current": False,
            "start_date": datetime(2025, 1, 1),
            "end_date": datetime(2025, 12, 31),
            "notes": "Previous historical assignment completed successfully with zero backlog",
        },
    ]:
        existing_assign = db.query(EngineerWardAssignment).filter(
            EngineerWardAssignment.employee_id == assign_data["employee_id"],
            EngineerWardAssignment.ward_id == assign_data["ward_id"]
        ).first()
        if not existing_assign:
            db.add(EngineerWardAssignment(**assign_data))
    db.commit()

    # Check if already seeded
    if db.query(Ward).count() > 0:
        return

    print("Seeding CivicFix AI database with realistic demo data...")

    # Create synthetic images
    demo_images = create_synthetic_demo_images(settings.BASE_DIR)

    # 1. Users (passwords stored as bcrypt hashes)
    users = [
        # Primary standard accounts
        User(
            email="citizen@civicfix.org",
            full_name="Aarav Sharma",
            role=UserRole.CITIZEN,
            phone="+91 98200 12345",
            hashed_password=hash_password(DEMO_PASSWORDS["citizen"]),
        ),
        User(
            email="contractor@roadworks.in",
            full_name="RoadWorks Infrastructure Unit A",
            role=UserRole.CONTRACTOR,
            phone="+91 98201 67890",
            hashed_password=hash_password(DEMO_PASSWORDS["contractor"]),
        ),
        User(
            email="engineer@mcgm.gov.in",
            full_name="Er. Rajesh Kulkarni",
            role=UserRole.WARD_ENGINEER,
            phone="+91 98202 34567",
            hashed_password=hash_password(DEMO_PASSWORDS["engineer"]),
        ),
        User(
            email="admin@civicfix.org",
            full_name="CivicFix Admin",
            role=UserRole.ADMIN,
            phone="+91 98203 98765",
            hashed_password=hash_password(DEMO_PASSWORDS["admin"]),
        ),
        # Aliases matching test suite expectations
        User(
            email="citizen@civicfix.ai",
            full_name="Aarav Sharma (AI)",
            role=UserRole.CITIZEN,
            phone="+91 98200 12345",
            hashed_password=hash_password(DEMO_PASSWORDS["citizen"]),
        ),
        User(
            email="contractor@civicfix.ai",
            full_name="RoadWorks Unit A (AI)",
            role=UserRole.CONTRACTOR,
            phone="+91 98201 67890",
            hashed_password=hash_password(DEMO_PASSWORDS["contractor"]),
        ),
        User(
            email="engineer@civicfix.ai",
            full_name="Er. Rajesh Kulkarni (AI)",
            role=UserRole.WARD_ENGINEER,
            phone="+91 98202 34567",
            hashed_password=hash_password(DEMO_PASSWORDS["engineer"]),
        ),
        User(
            email="admin@civicfix.ai",
            full_name="CivicFix Admin (AI)",
            role=UserRole.ADMIN,
            phone="+91 98203 98765",
            hashed_password=hash_password(DEMO_PASSWORDS["admin"]),
        ),
    ]
    db.add_all(users)
    db.flush()

    # 2. Contractors
    contractors = [
        Contractor(name="RoadWorks Unit A", company_name="RoadWorks Infrastructure Pvt Ltd", phone="+91 98201 67890", email="contractor@roadworks.in", rating=4.8, active_orders=3),
        Contractor(name="Apex Civil Works", company_name="Apex Infrastructure Solutions", phone="+91 98204 11223", email="contact@apexcivil.com", rating=4.8, active_orders=3),
        Contractor(name="Mumbai Urban Infra", company_name="MUI Projects Ltd", phone="+91 98205 44556", email="info@mui-projects.in", rating=4.2, active_orders=5),
        Contractor(name="Thane Paving Ltd", company_name="Thane City Paving Contractors", phone="+91 98206 77889", email="help@thanepaving.com", rating=4.4, active_orders=1),
        Contractor(name="Navi Mumbai Infra", company_name="NMMC Works Group", phone="+91 98207 88990", email="ops@navimumbaiinfra.in", rating=4.6, active_orders=2),
    ]
    db.add_all(contractors)
    db.flush()

    # 3. Wards — All 41 Municipal Wards of Mumbai, Thane, and Navi Mumbai
    wards_data = [
        {"name": "Ward A - Churchgate, Colaba, Fort", "code": "A", "city": "Mumbai", "lat": 18.922, "lng": 72.8347},
        {"name": "Ward B - Masjid Bunder, Dongri", "code": "B", "city": "Mumbai", "lat": 18.9515, "lng": 72.8375},
        {"name": "Ward C - Pydhonie, Bhuleshwar", "code": "C", "city": "Mumbai", "lat": 18.9525, "lng": 72.8273},
        {"name": "Ward D - Malabar Hill, Grant Road", "code": "D", "city": "Mumbai", "lat": 18.9667, "lng": 72.8167},
        {"name": "Ward E - Byculla, Nagpada", "code": "E", "city": "Mumbai", "lat": 18.9772, "lng": 72.8335},
        {"name": "Ward F/North - Matunga, Sion", "code": "F/N", "city": "Mumbai", "lat": 19.0268, "lng": 72.8553},
        {"name": "Ward F/South - Parel, Sewri", "code": "F/S", "city": "Mumbai", "lat": 18.9954, "lng": 72.8396},
        {"name": "Ward G/North - Dadar, Dharavi", "code": "G/N", "city": "Mumbai", "lat": 19.0178, "lng": 72.8478},
        {"name": "Ward G/South - Worli, Lower Parel", "code": "G/S", "city": "Mumbai", "lat": 19.0068, "lng": 72.8156},
        {"name": "Ward H/East - Santacruz East, Kalina", "code": "H/E", "city": "Mumbai", "lat": 19.0805, "lng": 72.853},
        {"name": "Ward H/West - Bandra West", "code": "H/W", "city": "Mumbai", "lat": 19.0596, "lng": 72.8295},
        {"name": "Ward K/East - Andheri East", "code": "K/E", "city": "Mumbai", "lat": 19.1136, "lng": 72.8697},
        {"name": "Ward K/West - Andheri West", "code": "K/W", "city": "Mumbai", "lat": 19.1363, "lng": 72.8277},
        {"name": "Ward P/North - Malad", "code": "P/N", "city": "Mumbai", "lat": 19.1866, "lng": 72.8486},
        {"name": "Ward P/South - Goregaon", "code": "P/S", "city": "Mumbai", "lat": 19.1645, "lng": 72.8499},
        {"name": "Ward R/Central - Borivali", "code": "R/C", "city": "Mumbai", "lat": 19.2307, "lng": 72.8567},
        {"name": "Ward R/North - Dahisar", "code": "R/N", "city": "Mumbai", "lat": 19.2501, "lng": 72.8593},
        {"name": "Ward R/South - Kandivali", "code": "R/S", "city": "Mumbai", "lat": 19.2045, "lng": 72.836},
        {"name": "Ward L - Kurla, Sakinaka", "code": "L", "city": "Mumbai", "lat": 19.0726, "lng": 72.8845},
        {"name": "Ward M/East - Govandi, Mankhurd", "code": "M/E", "city": "Mumbai", "lat": 19.056, "lng": 72.9126},
        {"name": "Ward M/West - Chembur", "code": "M/W", "city": "Mumbai", "lat": 19.0345, "lng": 72.8953},
        {"name": "Ward N - Ghatkopar", "code": "N", "city": "Mumbai", "lat": 19.0864, "lng": 72.9082},
        {"name": "Ward S - Bhandup, Vikhroli", "code": "S", "city": "Mumbai", "lat": 19.1438, "lng": 72.9304},
        {"name": "Ward T - Mulund", "code": "T", "city": "Mumbai", "lat": 19.1723, "lng": 72.9565},
        {"name": "Naupada - Kopri", "code": "TMC-1", "city": "Thane", "lat": 19.1824, "lng": 72.9696},
        {"name": "Uthalsar", "code": "TMC-2", "city": "Thane", "lat": 19.1979, "lng": 72.9774},
        {"name": "Majiwada - Manpada", "code": "TMC-3", "city": "Thane", "lat": 19.2301, "lng": 72.9712},
        {"name": "Vartak Nagar", "code": "TMC-4", "city": "Thane", "lat": 19.2066, "lng": 72.9529},
        {"name": "Wagle Estate", "code": "TMC-5", "city": "Thane", "lat": 19.1915, "lng": 72.9463},
        {"name": "Lokmanya Nagar - Savarkar Nagar", "code": "TMC-6", "city": "Thane", "lat": 19.2132, "lng": 72.9427},
        {"name": "Kalwa", "code": "TMC-7", "city": "Thane", "lat": 19.1994, "lng": 72.9972},
        {"name": "Mumbra", "code": "TMC-8", "city": "Thane", "lat": 19.176, "lng": 73.0233},
        {"name": "Diva", "code": "TMC-9", "city": "Thane", "lat": 19.1852, "lng": 73.0401},
        {"name": "Belapur", "code": "NMMC-1", "city": "Navi Mumbai", "lat": 19.0163, "lng": 73.0374},
        {"name": "Nerul", "code": "NMMC-2", "city": "Navi Mumbai", "lat": 19.033, "lng": 73.018},
        {"name": "Turbhe", "code": "NMMC-3", "city": "Navi Mumbai", "lat": 19.0725, "lng": 73.0157},
        {"name": "Vashi", "code": "NMMC-4", "city": "Navi Mumbai", "lat": 19.07, "lng": 72.998},
        {"name": "Kopar Khairane", "code": "NMMC-5", "city": "Navi Mumbai", "lat": 19.1026, "lng": 73.0035},
        {"name": "Ghansoli", "code": "NMMC-6", "city": "Navi Mumbai", "lat": 19.1254, "lng": 72.9992},
        {"name": "Airoli", "code": "NMMC-7", "city": "Navi Mumbai", "lat": 19.1517, "lng": 72.9934},
        {"name": "Digha", "code": "NMMC-8", "city": "Navi Mumbai", "lat": 19.1678, "lng": 72.993},
    ]

    wards = []
    for w in wards_data:
        ward = Ward(name=w["name"], code=w["code"], city=w["city"], center_lat=w["lat"], center_lng=w["lng"])
        db.add(ward)
        wards.append(ward)
    db.flush()

    # Find key wards by code for demo case relationships
    gn_ward = next(w for w in wards if w.code == "G/N")
    hw_ward = next(w for w in wards if w.code == "H/W")
    ke_ward = next(w for w in wards if w.code == "K/E")
    l_ward = next(w for w in wards if w.code == "L")

    # 4. Roads
    roads_data = [
<<<<<<< HEAD
        (gn_ward, "Gokhale Road North"),
        (gn_ward, "Ranade Road"),
        (hw_ward, "Hill Road"),
        (hw_ward, "Linking Road"),
        (ke_ward, "Sahar Road"),
        (ke_ward, "Andheri-Kurla Road"),
        (l_ward, "LBS Marg"),
=======
        (wards[7], "Gokhale Road North"),
        (wards[7], "Ranade Road"),
        (wards[10], "Hill Road"),
        (wards[10], "Linking Road"),
        (wards[11], "Sahar Road"),
        (wards[11], "Andheri-Kurla Road"),
        (wards[18], "LBS Marg"),
        (wards[24], "Gokhale Road Thane"),
        (wards[26], "Ghodbunder Highway"),
        (wards[36], "Palm Beach Road"),
        (wards[34], "Nerul Station Road"),
>>>>>>> origin/feature/ai-and-map-updates
    ]
    roads = []
    for ward, road_name in roads_data:
        road = Road(name=road_name, ward_id=ward.id, road_type="Major Collector")
        db.add(road)
        roads.append(road)
    db.flush()

    # 5. Realistic Cases across all lifecycle stages
    now = datetime.utcnow()
    c1 = contractors[0]
<<<<<<< HEAD
    w1 = gn_ward
=======
    w1 = wards[7]  # G/N
>>>>>>> origin/feature/ai-and-map-updates
    r1 = roads[0]

    # Case 1: VERIFIED with full verification result (Gold standard demo case)
    case_verified = Case(
        id="CF-1019",
        title="Deep Pothole at Gokhale Road Junction",
        description="Hazardous crater near junction signal causing severe vehicle swerving and waterlogging.",
        severity="High",
        status="VERIFIED",
        ward_id=w1.id,
        road_id=r1.id,
        created_at=now - timedelta(days=5),
    )
    db.add(case_verified)
    db.flush()

    loc1 = CaseLocation(case_id=case_verified.id, latitude=19.0182, longitude=72.8485, address="Gokhale Road North, Dadar West", landmark="Near Plaza Cinema Junction")
    db.add(loc1)

    wo1 = WorkOrder(
        id="WO-1019",
        case_id=case_verified.id,
        contractor_id=c1.id,
        assigned_latitude=19.0182,
        assigned_longitude=72.8485,
        priority="High",
        status="Verified",
        assigned_at=now - timedelta(days=4),
        deadline=now - timedelta(days=1),
        completed_at=now - timedelta(hours=6),
    )
    db.add(wo1)
    db.flush()

    ev_before1 = EvidenceFile(
        id="EV-1019-B",
        case_id=case_verified.id,
        work_order_id=wo1.id,
        contractor_id=c1.id,
        capture_type="BEFORE",
        storage_path=demo_images["before"],
        file_name="pothole_before_demo.jpg",
        file_hash="hash_before_1019",
        latitude=19.01825,
        longitude=72.84852,
        captured_at=now - timedelta(days=3),
        validation_status="VALID",
    )
    ev_after1 = EvidenceFile(
        id="EV-1019-A",
        case_id=case_verified.id,
        work_order_id=wo1.id,
        contractor_id=c1.id,
        capture_type="AFTER",
        storage_path=demo_images["after_verified"],
        file_name="pothole_after_verified_demo.jpg",
        file_hash="hash_after_1019",
        latitude=19.01829,
        longitude=72.84856,
        captured_at=now - timedelta(hours=6),
        validation_status="VALID",
    )
    db.add_all([ev_before1, ev_after1])
    db.flush()

    vr1 = VerificationResult(
        id="VR-1019",
        case_id=case_verified.id,
        work_order_id=wo1.id,
        overall_score=94.5,
        status="VERIFIED",
        summary="Repair successfully verified by AI (Confidence: 94.5/100). All geospatial, perspective, and surface criteria passed.",
        started_at=now - timedelta(hours=6),
        completed_at=now - timedelta(hours=6),
    )
    db.add(vr1)
    db.flush()

    checks1 = [
        VerificationCheck(verification_id=vr1.id, check_type="GPS", status="PASS", score=98.0, confidence=0.98, details_json='{"distance_m": 4.2, "message": "Capture GPS within 4.2m of assigned work order location."}'),
        VerificationCheck(verification_id=vr1.id, check_type="PERSPECTIVE", status="PASS", score=92.0, confidence=0.92, details_json='{"inlier_count": 38, "message": "High geometric scene consistency verified (38 RANSAC inliers)."}'),
        VerificationCheck(verification_id=vr1.id, check_type="LANDMARK", status="PASS", score=90.0, confidence=0.90, details_json='{"peripheral_matches": 18, "message": "Strong peripheral landmark matches on curb and lane divider."}'),
        VerificationCheck(verification_id=vr1.id, check_type="POTHOLE", status="PASS", score=95.0, confidence=0.95, details_json='{"state_change_percent": 91.2, "message": "Pothole cavity filled and asphalt surface restored. State change: 91.2%."}'),
        VerificationCheck(verification_id=vr1.id, check_type="INTEGRITY", status="PASS", score=100.0, confidence=1.0, details_json='{"identical_hash_detected": false, "message": "Evidence metadata, chronological ordering, and hash integrity verified."}'),
    ]
    db.add_all(checks1)

    # Case 2: NEEDS_REVIEW Case (Borderline perspective/landmark)
    case_review = Case(
        id="CF-1025",
        title="Multiple Potholes on Ranade Road Curve",
        description="Cluster of sharp edge craters causing two-wheeler skidding.",
        severity="High",
        status="NEEDS_REVIEW",
        ward_id=w1.id,
        road_id=roads[1].id,
        created_at=now - timedelta(days=3),
    )
    db.add(case_review)
    db.flush()
    loc2 = CaseLocation(case_id=case_review.id, latitude=19.0195, longitude=72.8465, address="Ranade Road, Dadar West", landmark="Opposite Municipal Market")
    db.add(loc2)
    wo2 = WorkOrder(
        id="WO-1025",
        case_id=case_review.id,
        contractor_id=c1.id,
        assigned_latitude=19.0195,
        assigned_longitude=72.8465,
        priority="High",
        status="Needs Review",
        assigned_at=now - timedelta(days=2),
        deadline=now + timedelta(days=1),
    )
    db.add(wo2)
    db.flush()

    ev_before2 = EvidenceFile(
        id="EV-1025-B",
        case_id=case_review.id,
        work_order_id=wo2.id,
        contractor_id=c1.id,
        capture_type="BEFORE",
        storage_path=demo_images["before"],
        file_name="pothole_before_demo.jpg",
        file_hash="hash_before_1025",
        latitude=19.01955,
        longitude=72.84655,
        captured_at=now - timedelta(days=2),
        validation_status="VALID"
    )
    ev_after2 = EvidenceFile(
        id="EV-1025-A",
        case_id=case_review.id,
        work_order_id=wo2.id,
        contractor_id=c1.id,
        capture_type="AFTER",
        storage_path=demo_images["after_unrepaired"],
        file_name="pothole_after_unrepaired_demo.jpg",
        file_hash="hash_after_1025",
        latitude=19.01959,
        longitude=72.84659,
        captured_at=now - timedelta(hours=3),
        validation_status="VALID"
    )
    db.add_all([ev_before2, ev_after2])
    db.flush()

    vr2 = VerificationResult(
        id="VR-1025",
        case_id=case_review.id,
        work_order_id=wo2.id,
        overall_score=68.5,
        status="NEEDS_REVIEW",
        summary="Flagged for Engineer Review (Score: 68.5/100). Camera angle varied significantly between BEFORE and AFTER captures.",
        started_at=now - timedelta(hours=3),
        completed_at=now - timedelta(hours=3),
    )
    db.add(vr2)
    db.flush()

    checks2 = [
        VerificationCheck(verification_id=vr2.id, check_type="GPS", status="PASS", score=88.0, confidence=0.88, details_json='{"distance_m": 12.1, "message": "GPS is within acceptable tolerance (12.1m)."}'),
        VerificationCheck(verification_id=vr2.id, check_type="PERSPECTIVE", status="REVIEW", score=52.0, confidence=0.70, details_json='{"inlier_count": 7, "message": "Low feature inliers (7). Camera angle altered between captures."}'),
        VerificationCheck(verification_id=vr2.id, check_type="LANDMARK", status="REVIEW", score=55.0, confidence=0.68, details_json='{"peripheral_matches": 4, "message": "Partial landmark matches. Potential vehicle obstruction."}'),
        VerificationCheck(verification_id=vr2.id, check_type="POTHOLE", status="PASS", score=82.0, confidence=0.85, details_json='{"state_change_percent": 79.4, "message": "Patch detected over pothole cavity."}'),
        VerificationCheck(verification_id=vr2.id, check_type="INTEGRITY", status="PASS", score=100.0, confidence=1.0, details_json='{"message": "Metadata valid."}'),
    ]
    db.add_all(checks2)

    # Case 3: REPORTED (Awaiting municipal validation)
    case_reported = Case(
        id="CF-1031",
        title="Pothole Near Bus Stop 14",
        description="Fresh pothole formed after heavy rainfall. Dangerous for alighting commuters.",
        severity="Medium",
        status="REPORTED",
<<<<<<< HEAD
        ward_id=hw_ward.id,
=======
        ward_id=wards[10].id,
>>>>>>> origin/feature/ai-and-map-updates
        road_id=roads[2].id,
        created_at=now - timedelta(hours=8),
    )
    db.add(case_reported)
    db.flush()
    db.add(CaseLocation(case_id=case_reported.id, latitude=19.0598, longitude=72.8310, address="Hill Road, Bandra West", landmark="Near St. Andrew's Church"))

    # Case 4: VALIDATED (Ready for contractor assignment)
    case_validated = Case(
        id="CF-1028",
        title="Asphalt Depression on Linking Road",
        description="Sunken road trench extending 2 meters across lane.",
        severity="High",
        status="VALIDATED",
<<<<<<< HEAD
        ward_id=hw_ward.id,
=======
        ward_id=wards[10].id,
>>>>>>> origin/feature/ai-and-map-updates
        road_id=roads[3].id,
        created_at=now - timedelta(days=1),
    )
    db.add(case_validated)
    db.flush()
    db.add(CaseLocation(case_id=case_validated.id, latitude=19.0620, longitude=72.8335, address="Linking Road, Bandra West", landmark="Opposite National College"))

    # Case 5: ASSIGNED (Contractor needs to capture BEFORE and start repair)
    case_assigned = Case(
        id="CF-1023",
        title="Cracked Road Surface on Sahar Road",
        description="Severe pitting and potholes near metro construction entry.",
        severity="High",
        status="ASSIGNED",
<<<<<<< HEAD
        ward_id=ke_ward.id,
=======
        ward_id=wards[11].id,
>>>>>>> origin/feature/ai-and-map-updates
        road_id=roads[4].id,
        created_at=now - timedelta(days=2),
    )
    db.add(case_assigned)
    db.flush()
    db.add(CaseLocation(case_id=case_assigned.id, latitude=19.1140, longitude=72.8710, address="Sahar Road, Andheri East", landmark="Near Sahar Cargo Complex"))
    db.add(WorkOrder(
        id="WO-1023",
        case_id=case_assigned.id,
        contractor_id=c1.id,
        assigned_latitude=19.1140,
        assigned_longitude=72.8710,
        priority="High",
        status="Assigned",
        assigned_at=now - timedelta(hours=14),
        deadline=now + timedelta(days=2),
    ))

    # Case 6: REPAIRING (BEFORE captured, active on ground)
    case_repairing = Case(
        id="CF-1021",
        title="Wide Crater on Andheri-Kurla Road",
        description="Crater 15cm deep causing vehicular slow-downs.",
        severity="High",
        status="REPAIRING",
<<<<<<< HEAD
        ward_id=ke_ward.id,
=======
        ward_id=wards[11].id,
>>>>>>> origin/feature/ai-and-map-updates
        road_id=roads[5].id,
        created_at=now - timedelta(days=3),
    )
    db.add(case_repairing)
    db.flush()
    db.add(CaseLocation(case_id=case_repairing.id, latitude=19.1120, longitude=72.8750, address="Andheri-Kurla Road", landmark="Near Chakala Metro Station"))
    wo_rep = WorkOrder(
        id="WO-1021",
        case_id=case_repairing.id,
        contractor_id=c1.id,
        assigned_latitude=19.1120,
        assigned_longitude=72.8750,
        priority="High",
        status="In Progress",
        assigned_at=now - timedelta(days=1),
        deadline=now + timedelta(days=1),
    )
    db.add(wo_rep)
    db.flush()
    db.add(EvidenceFile(
        id="EV-1021-B",
        case_id=case_repairing.id,
        work_order_id=wo_rep.id,
        contractor_id=c1.id,
        capture_type="BEFORE",
        storage_path=demo_images["before"],
        file_name="pothole_before_demo.jpg",
        file_hash="hash_before_1021",
        latitude=19.11204,
        longitude=72.87508,
        captured_at=now - timedelta(hours=4),
        validation_status="VALID",
    ))

    # Log initial seed audit
    log_audit_event(db=db, action="SYSTEM_INITIALIZED", entity_type="System", entity_id="SEED-01", actor_name="CivicFix System", actor_role="SYSTEM", details={"cases_seeded": 6, "wards_seeded": len(wards)})

    db.commit()
    print("Database seeding completed successfully.")