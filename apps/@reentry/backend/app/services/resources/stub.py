from . import ResourceCategory, ResourceSubcategory

resources = {
    ResourceCategory.BASIC_NEEDS: {
        ResourceSubcategory.HOUSING: [
            {
                "id": "867e652b-07b1-40a8-a1e5-5607b4a1f4b4",
                "name": "Safe Harbor Shelter",
                "phone": "092085372",
                "address": "123 Main St, Cityville",
            }
        ],
        ResourceSubcategory.FOOD_ASSISTANCE: [
            {
                "id": "2cd4dda4-81df-4fae-a982-1d9e1b28f3bd",
                "name": "City Outreach Food Center",
                "phone": "800-495-7811",
                "address": "2 Community Rd, Townburg",
            }
        ],
        ResourceSubcategory.CLOTHING: [
            {
                "id": "d2db05df-6117-483d-a643-a51ad0a64524",
                "name": "Community Clothing Center",
                "phone": "800-555-1001",
                "address": "100 Main St, Anytown, CA",
            }
        ],
    },
    ResourceCategory.EMPLOYMENT_AND_CAREER: {
        ResourceSubcategory.JOB_TRAINING: [
            {
                "id": "318dfa22-851f-463b-aa04-3de42d519e29",
                "name": "Trade Skills Training Center",
                "phone": "800-555-4001",
                "address": "700 Trades St, Anytown, CA",
            }
        ],
        ResourceSubcategory.JOB_PLACEMENT: [
            {
                "id": "a2f15eba-2bac-4b69-8357-73dec186f92e",
                "name": "Career Pathways Employment",
                "phone": "800-495-7830",
                "address": "2 Job Ave, Suburbia",
            }
        ],
        ResourceSubcategory.RESUME_INTERVIEW: [
            {
                "id": "d8123cbb-1e68-4014-92d2-61e3a80dbb70",
                "name": "Career Development Center",
                "phone": "800-555-6001",
                "address": "1100 Career Path, Anytown, CA",
            }
        ],
        ResourceSubcategory.CERTIFICATION: [
            {
                "id": "d1094847-1fc9-43f9-85de-539779d74ed6",
                "name": "Professional Certification Center",
                "phone": "800-555-6010",
                "address": "1200 Cert Way, Anytown, CA",
            }
        ],
    },
    ResourceCategory.EDUCATION: {
        ResourceSubcategory.HIGH_SCHOOL_EQUIV: [
            {
                "id": "0bc61405-93c6-4355-9beb-dc5493035c02",
                "name": "Seattle Public Schools Re-Engagement Program",
                "phone": "800-495-7802",
                "address": "15 Transit Blvd, Townburg",
            }
        ],
        ResourceSubcategory.POST_SECONDARY: [
            {
                "id": "2f48d220-1020-45be-acc7-1e360c2b0e89",
                "name": "Youth Learning Center",
                "phone": "800-495-7840",
                "address": "2 Knowledge Ave, Suburbia",
            }
        ],
        ResourceSubcategory.LITERACY: [
            {
                "id": "d3f83242-011b-47e2-9777-9e4e8b415336",
                "name": "Community Literacy Program",
                "phone": "800-555-7100",
                "address": "300 Reading Lane, Anytown, CA",
            }
        ],
        ResourceSubcategory.DIGITAL_LITERACY: [
            {
                "id": "c02b501a-b150-494d-b3cf-1bc6df094a75",
                "name": "Digital Skills Training Center",
                "phone": "800-555-7200",
                "address": "400 Tech Boulevard, Anytown, CA",
            }
        ],
    },
    ResourceCategory.BEHAVIORAL_HEALTH: {
        ResourceSubcategory.MENTAL_HEALTH: [
            {
                "id": "31020db7-17ec-4fbd-8820-daa3b25cfe62",
                "name": "City Mental Health Center",
                "phone": "800-600-7730",
                "address": "300 Therapy Ave, Cityville",
            }
        ],
        ResourceSubcategory.SUBSTANCE_ABUSE: [
            {
                "id": "5d948fd9-158d-4c07-aac5-a5c84cbc8f67",
                "name": "Recovery Center",
                "phone": "800-600-7740",
                "address": "400 Healing St, Cityville",
            }
        ],
        ResourceSubcategory.TRAUMA_CARE: [
            {
                "id": "991d4318-fce1-4133-a4dd-ad9861fd21af",
                "name": "Trauma Recovery Center",
                "phone": "800-555-7300",
                "address": "500 Healing Path, Anytown, CA",
            }
        ],
    },
    ResourceCategory.MEDICAL_AND_HEALTH: {
        ResourceSubcategory.PRIMARY_CARE: [
            {
                "id": "d405ba79-09da-4af7-8266-ccb344149e0f",
                "name": "City General Hospital",
                "phone": "800-600-7701",
                "address": "100 Main St, Cityville",
            },
            {
                "id": "d405ba79-09da-4af7-8266-ccb344149e0D",
                "name": "City Other Hospital",
                "phone": "800-600-7702",
                "address": "100 Main St, CityCity",
            },
        ],
        ResourceSubcategory.SPECIALIZED_CARE: [
            {
                "id": "6ee97e99-264f-4fee-a637-79a8dfae5c3e",
                "name": "Specialized Medical Center",
                "phone": "800-555-7400",
                "address": "600 Specialist Ave, Anytown, CA",
            }
        ],
        ResourceSubcategory.ADDICTION_MEDICINE: [
            {
                "id": "132c5261-35ad-4a5b-a75e-10bf76389ef0",
                "name": "Addiction Treatment Clinic",
                "phone": "800-555-7500",
                "address": "700 Recovery Road, Anytown, CA",
            }
        ],
        ResourceSubcategory.HIV_AIDS: [
            {
                "id": "433e3832-34c5-4706-ba3f-56c69ac6fcbe",
                "name": "HIV/AIDS Care Center",
                "phone": "800-555-7600",
                "address": "800 Care Lane, Anytown, CA",
            }
        ],
    },
    ResourceCategory.LEGAL_AND_FINANCIAL: {
        ResourceSubcategory.ID_SERVICES: [
            {
                "id": "dcacafdf-98b5-4fa3-86ce-d48a4efc6d02",
                "name": "ID Documentation Center",
                "phone": "800-555-7700",
                "address": "900 Identity Way, Anytown, CA",
            }
        ],
        ResourceSubcategory.LEGAL_AID: [
            {
                "id": "77421150-0111-491b-a069-18bc7d2ab055",
                "name": "City Legal Assistance",
                "phone": "800-700-8801",
                "address": "100 Justice St, Cityville",
            }
        ],
        ResourceSubcategory.FINANCIAL_LITERACY: [
            {
                "id": "30e73445-9365-4980-a447-ab0abf14566f",
                "name": "Financial Education Center",
                "phone": "800-555-7800",
                "address": "1000 Finance Blvd, Anytown, CA",
            }
        ],
        ResourceSubcategory.EMERGENCY_FINANCIAL: [
            {
                "id": "10c6a7d7-4a40-4a98-b497-3b74f7807231",
                "name": "Helping Hands Financial",
                "phone": "800-495-7820",
                "address": "456 Cash Blvd, Townburg",
            }
        ],
    },
    ResourceCategory.FAMILY_AND_COMMUNITY: {
        ResourceSubcategory.FAMILY_REUNIFICATION: [
            {
                "id": "9e5c126a-be49-4765-8bec-ca70c04efdac",
                "name": "Family Support Services",
                "phone": "800-555-1101",
                "address": "2100 Family Support Dr, Anytown, CA",
            }
        ],
        ResourceSubcategory.MENTORSHIP: [
            {
                "id": "5047ecc6-e622-418d-b5c1-0aedc2af82f8",
                "name": "Community Mentorship Program",
                "phone": "800-555-7900",
                "address": "1100 Mentor Way, Anytown, CA",
            }
        ],
        ResourceSubcategory.FAITH_BASED: [
            {
                "id": "a9ca154d-eb63-4b84-b4b3-e5d8e81b59c5",
                "name": "Interfaith Support Center",
                "phone": "800-555-8000",
                "address": "1200 Faith Ave, Anytown, CA",
            }
        ],
        ResourceSubcategory.REENTRY_GROUPS: [
            {
                "id": "d2c0718f-5267-4e70-a3ab-6b6963ed172a",
                "name": "Reentry Support Network",
                "phone": "800-555-8100",
                "address": "1300 New Start Blvd, Anytown, CA",
            }
        ],
    },
    ResourceCategory.TRANSPORTATION: {
        ResourceSubcategory.PUBLIC_TRANSIT: [
            {
                "id": "c7f1ecf4-5b27-4d97-a72a-76a281652de5",
                "name": "City Transit Assistance",
                "phone": "800-600-7720",
                "address": "200 Transit Blvd, Cityville",
            }
        ],
        ResourceSubcategory.DRIVERS_LICENSE: [
            {
                "id": "752b6be1-ec5e-4c04-9010-719407b2ff9c",
                "name": "License Restoration Program",
                "phone": "800-555-8200",
                "address": "1400 License Way, Anytown, CA",
            }
        ],
        ResourceSubcategory.TRANSPORT_SERVICES: [
            {
                "id": "5b67e325-b1aa-4ac7-90c2-794f6058b307",
                "name": "Suburban Transit Solutions",
                "phone": "800-600-7721",
                "address": "201 Commute Ln, Suburbia",
            }
        ],
    },
    ResourceCategory.SPECIALIZED_SERVICES: {
        ResourceSubcategory.DOMESTIC_VIOLENCE: [
            {
                "id": "272bd2ed-d294-4408-a983-af53de0184b0",
                "name": "Domestic Violence Support Center",
                "phone": "800-555-8300",
                "address": "1500 Safe Haven Lane, Anytown, CA",
            }
        ],
        ResourceSubcategory.SEX_OFFENDER: [
            {
                "id": "ee188a42-81e0-4e45-934e-642c17a22f8f",
                "name": "Rehabilitation Support Program",
                "phone": "800-555-8400",
                "address": "1600 Recovery Road, Anytown, CA",
            }
        ],
        ResourceSubcategory.YOUTH_RESOURCES: [
            {
                "id": "b64c4ba8-7039-4a75-bfbc-287a6fdf70a0",
                "name": "Youth Support Center",
                "phone": "800-555-8500",
                "address": "1700 Youth Way, Anytown, CA",
                "llm_rank": 7,
            }
        ],
        ResourceSubcategory.CULTURAL_PROGRAMS: [
            {
                "id": "aee9168b-897e-42fb-85dd-33c45c3cd27a",
                "name": "Cultural Integration Center",
                "phone": "800-555-8600",
                "address": "1800 Culture Blvd, Anytown, CA",
                "llm_rank": 2,
            }
        ],
    },
    ResourceCategory.COMMUNITY_REINTEGRATION: {
        ResourceSubcategory.VOLUNTEER: [
            {
                "id": "6917dfb5-6355-4e4b-9b4c-84b924d2ba13",
                "name": "Community Volunteer Center",
                "phone": "800-555-8700",
                "address": "1900 Volunteer Way, Anytown, CA",
                "llm_rank": 2,
            }
        ],
        ResourceSubcategory.RECREATION: [
            {
                "id": "b308e84d-a030-495e-8990-b3aeb7f2dd42",
                "name": "Community Recreation Center",
                "phone": "800-555-8800",
                "address": "2000 Recreation Blvd, Anytown, CA",
                "llm_rank": 4,
            }
        ],
        ResourceSubcategory.CIVIC_ENGAGEMENT: [
            {
                "id": "91e6b7a9-9e67-48ad-b8bc-a7bf8741fc88",
                "name": "Civic Participation Center",
                "phone": "800-555-8900",
                "address": "2100 Civic Center Dr, Anytown, CA",
                "llm_rank": 1,
            }
        ],
    },
}
