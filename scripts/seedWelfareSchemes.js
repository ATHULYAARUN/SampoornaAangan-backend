const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

// Sample welfare schemes for children aged 3-6 years
const welfareSchemesData = [
  // Boys' Schemes
  {
    name: "Balak Vikas Yojana",
    description: "Comprehensive development scheme for male children focusing on nutrition, health, and early education support in Anganwadi centers.",
    category: "development",
    benefits: {
      amount: 1500,
      frequency: "monthly",
      description: "Monthly nutrition allowance, free health checkups, educational materials"
    },
    eligibility: {
      minAge: 3,
      maxAge: 6,
      gender: "male",
      income: "below_poverty_line"
    },
    documents: [
      "Birth Certificate",
      "Income Certificate",
      "Anganwadi Registration",
      "Aadhaar Card"
    ],
    isActive: true
  },
  {
    name: "Swasth Balak Scheme",
    description: "Health and nutrition focused scheme providing medical support, vaccination tracking, and growth monitoring for boys.",
    category: "health",
    benefits: {
      amount: 2000,
      frequency: "monthly",
      description: "Free medical checkups, vaccination, nutritional supplements, growth monitoring"
    },
    eligibility: {
      minAge: 3,
      maxAge: 6,
      gender: "male",
      income: "all"
    },
    documents: [
      "Birth Certificate",
      "Medical Records",
      "Anganwadi Registration"
    ],
    isActive: true
  },
  {
    name: "Shiksha Prarambh (Boys)",
    description: "Early education support scheme for boys providing learning materials, pre-school education, and skill development activities.",
    category: "education",
    benefits: {
      amount: 1200,
      frequency: "monthly",
      description: "Educational toys, books, pre-school training, skill development activities"
    },
    eligibility: {
      minAge: 4,
      maxAge: 6,
      gender: "male",
      income: "all"
    },
    documents: [
      "Birth Certificate",
      "Anganwadi Registration",
      "Parent ID Proof"
    ],
    isActive: true
  },

  // Girls' Schemes
  {
    name: "Balika Samriddhi Yojana",
    description: "Comprehensive development scheme for female children with focus on nutrition, health, and empowerment through Anganwadi programs.",
    category: "development",
    benefits: {
      amount: 1800,
      frequency: "monthly",
      description: "Monthly nutrition allowance, free health checkups, educational materials, girl child bonus"
    },
    eligibility: {
      minAge: 3,
      maxAge: 6,
      gender: "female",
      income: "below_poverty_line"
    },
    documents: [
      "Birth Certificate",
      "Income Certificate",
      "Anganwadi Registration",
      "Aadhaar Card"
    ],
    isActive: true
  },
  {
    name: "Swasth Balika Scheme",
    description: "Specialized health scheme for girls providing enhanced medical care, nutrition support, and development tracking.",
    category: "health",
    benefits: {
      amount: 2200,
      frequency: "monthly",
      description: "Free medical checkups, vaccination, nutritional supplements, girl-specific health monitoring"
    },
    eligibility: {
      minAge: 3,
      maxAge: 6,
      gender: "female",
      income: "all"
    },
    documents: [
      "Birth Certificate",
      "Medical Records",
      "Anganwadi Registration"
    ],
    isActive: true
  },
  {
    name: "Shiksha Prarambh (Girls)",
    description: "Enhanced early education support for girls with additional focus on empowerment and leadership development activities.",
    category: "education",
    benefits: {
      amount: 1400,
      frequency: "monthly",
      description: "Educational toys, books, pre-school training, leadership activities, girl empowerment programs"
    },
    eligibility: {
      minAge: 4,
      maxAge: 6,
      gender: "female",
      income: "all"
    },
    documents: [
      "Birth Certificate",
      "Anganwadi Registration",
      "Parent ID Proof"
    ],
    isActive: true
  },

  // Universal Schemes (Both)
  {
    name: "Anganwadi Nutrition Scheme",
    description: "Universal nutrition support scheme for all children enrolled in Anganwadi providing daily meals and take-home rations.",
    category: "nutrition",
    benefits: {
      amount: 1000,
      frequency: "monthly",
      description: "Daily hot cooked meals, take-home rations, nutrition counseling"
    },
    eligibility: {
      minAge: 3,
      maxAge: 6,
      gender: "both",
      income: "all"
    },
    documents: [
      "Birth Certificate",
      "Anganwadi Registration"
    ],
    isActive: true
  },
  {
    name: "Immunization Plus",
    description: "Comprehensive immunization and preventive healthcare scheme for all Anganwadi children with tracking and follow-up support.",
    category: "health",
    benefits: {
      amount: 800,
      frequency: "monthly",
      description: "Complete immunization, health screening, preventive care, medical tracking"
    },
    eligibility: {
      minAge: 3,
      maxAge: 6,
      gender: "both",
      income: "all"
    },
    documents: [
      "Birth Certificate",
      "Immunization Card",
      "Anganwadi Registration"
    ],
    isActive: true
  },
  {
    name: "Early Childhood Development",
    description: "Holistic development scheme covering cognitive, physical, and social development through structured Anganwadi activities.",
    category: "development",
    benefits: {
      amount: 1600,
      frequency: "monthly",
      description: "Cognitive activities, physical development programs, social skills training, parent counseling"
    },
    eligibility: {
      minAge: 3,
      maxAge: 6,
      gender: "both",
      income: "all"
    },
    documents: [
      "Birth Certificate",
      "Anganwadi Registration",
      "Development Assessment"
    ],
    isActive: true
  },
  {
    name: "Digital Learning Initiative",
    description: "Technology-enhanced learning program introducing basic digital literacy and interactive learning for modern education preparation.",
    category: "education",
    benefits: {
      amount: 900,
      frequency: "monthly",
      description: "Digital learning tablets, educational apps, tech literacy programs, online safety training"
    },
    eligibility: {
      minAge: 5,
      maxAge: 6,
      gender: "both",
      income: "all"
    },
    documents: [
      "Birth Certificate",
      "Anganwadi Registration",
      "Parent Consent Form"
    ],
    isActive: true
  }
];

async function seedWelfareSchemes() {
  try {
    console.log('🌱 Starting welfare schemes seeding...');
    
    // Check if schemes already exist
    const existingSchemes = await Scheme.countDocuments();
    if (existingSchemes > 0) {
      console.log(`📊 Found ${existingSchemes} existing schemes. Skipping seeding.`);
      return;
    }
    
    // Insert all schemes
    const insertedSchemes = await Scheme.insertMany(welfareSchemesData);
    console.log(`✅ Successfully seeded ${insertedSchemes.length} welfare schemes!`);
    
    // Log scheme summary
    const boySchemes = insertedSchemes.filter(s => s.eligibility.gender === 'male').length;
    const girlSchemes = insertedSchemes.filter(s => s.eligibility.gender === 'female').length;
    const universalSchemes = insertedSchemes.filter(s => s.eligibility.gender === 'both').length;
    
    console.log(`📋 Seeding Summary:`);
    console.log(`   • Boys' schemes: ${boySchemes}`);
    console.log(`   • Girls' schemes: ${girlSchemes}`);
    console.log(`   • Universal schemes: ${universalSchemes}`);
    console.log(`   • Total: ${insertedSchemes.length}`);
    
    return insertedSchemes;
    
  } catch (error) {
    console.error('❌ Error seeding welfare schemes:', error);
    throw error;
  }
}

module.exports = { seedWelfareSchemes, welfareSchemesData };