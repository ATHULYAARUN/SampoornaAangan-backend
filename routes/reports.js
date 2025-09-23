const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

// Import models
const User = require('../models/User');
const Child = require('../models/Child');
const PregnantWoman = require('../models/PregnantWoman');
const Adolescent = require('../models/Adolescent');
const Newborn = require('../models/Newborn');

// Import middleware
const { verifyFirebaseAuth, checkRole } = require('../middleware/auth');

// @desc    Get dashboard statistics for reports
// @route   GET /api/reports/dashboard-stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const [
      totalWorkers,
      totalChildren,
      totalPregnantWomen,
      totalAdolescents,
      totalNewborns,
      activeAnganwadis
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['anganwadi-worker', 'asha-volunteer'] }, status: 'active' }),
      Child.countDocuments({ status: 'active' }),
      PregnantWoman.countDocuments({ status: 'active' }),
      Adolescent.countDocuments({ status: 'active' }),
      Newborn.countDocuments({ status: 'active' }),
      User.distinct('anganwadiCenter', { role: { $in: ['anganwadi-worker', 'asha-volunteer'] }, status: 'active' }).then(centers => centers.length)
    ]);

    // Get worker distribution by anganwadi
    const workerDistribution = await User.aggregate([
      {
        $match: {
          role: { $in: ['anganwadi-worker', 'asha-volunteer'] },
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$anganwadiCenter',
          workerCount: { $sum: 1 },
          roles: { $push: '$role' }
        }
      },
      {
        $project: {
          anganwadiCenter: '$_id',
          workerCount: 1,
          anganwadiWorkers: {
            $size: {
              $filter: {
                input: '$roles',
                cond: { $eq: ['$$this', 'anganwadi-worker'] }
              }
            }
          },
          ashaVolunteers: {
            $size: {
              $filter: {
                input: '$roles',
                cond: { $eq: ['$$this', 'asha-volunteer'] }
              }
            }
          }
        }
      },
      { $sort: { workerCount: -1 } }
    ]);

    // Get children distribution by anganwadi
    const childrenDistribution = await Child.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$anganwadiCenter',
          childrenCount: { $sum: 1 },
          ageGroups: {
            $push: {
              $cond: [
                { $lte: ['$age', 2] }, '0-2',
                { $cond: [{ $lte: ['$age', 5] }, '3-5', '6+'] }
              ]
            }
          }
        }
      },
      {
        $project: {
          anganwadiCenter: '$_id',
          childrenCount: 1,
          age0to2: {
            $size: {
              $filter: {
                input: '$ageGroups',
                cond: { $eq: ['$$this', '0-2'] }
              }
            }
          },
          age3to5: {
            $size: {
              $filter: {
                input: '$ageGroups',
                cond: { $eq: ['$$this', '3-5'] }
              }
            }
          },
          age6plus: {
            $size: {
              $filter: {
                input: '$ageGroups',
                cond: { $eq: ['$$this', '6+'] }
              }
            }
          }
        }
      },
      { $sort: { childrenCount: -1 } }
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await Promise.all([
      Child.countDocuments({ enrollmentDate: { $gte: thirtyDaysAgo } }),
      PregnantWoman.countDocuments({ registrationDate: { $gte: thirtyDaysAgo } }),
      Adolescent.countDocuments({ registrationDate: { $gte: thirtyDaysAgo } }),
      Newborn.countDocuments({ registrationDate: { $gte: thirtyDaysAgo } })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalAnganwadis: activeAnganwadis,
          totalWorkers,
          totalChildren,
          totalPregnantWomen,
          totalAdolescents,
          totalNewborns,
          totalBeneficiaries: totalChildren + totalPregnantWomen + totalAdolescents + totalNewborns
        },
        distributions: {
          workerDistribution,
          childrenDistribution
        },
        recentActivity: {
          newChildren: recentRegistrations[0],
          newPregnantWomen: recentRegistrations[1],
          newAdolescents: recentRegistrations[2],
          newNewborns: recentRegistrations[3],
          totalNewRegistrations: recentRegistrations.reduce((sum, count) => sum + count, 0)
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// @desc    Get anganwadi centers with detailed information
// @route   GET /api/reports/anganwadi-centers
// @access  Private (Admin only)
const getAnganwadiCenters = async (req, res) => {
  try {
    const { search, ward, status } = req.query;

    // Build query for filtering
    let workerQuery = {
      role: { $in: ['anganwadi-worker', 'asha-volunteer'] }
    };

    if (status) {
      workerQuery.status = status;
    }

    if (search) {
      workerQuery.$or = [
        { anganwadiCenter: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    if (ward) {
      workerQuery.ward = ward;
    }

    // Get anganwadi centers with aggregated data
    const anganwadiData = await User.aggregate([
      { $match: workerQuery },
      {
        $group: {
          _id: '$anganwadiCenter',
          workers: {
            $push: {
              id: '$_id',
              name: '$name',
              role: '$role',
              phone: '$phone',
              email: '$email',
              status: '$status'
            }
          },
          workerCount: { $sum: 1 },
          ward: { $first: '$ward' },
          district: { $first: '$district' },
          address: { $first: '$address' },
          status: { $first: '$status' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get children count for each anganwadi
    const childrenCounts = await Child.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$anganwadiCenter',
          childrenCount: { $sum: 1 },
          children: {
            $push: {
              id: '$_id',
              name: '$name',
              age: '$age',
              parentName: '$parentName',
              enrollmentDate: '$enrollmentDate'
            }
          }
        }
      }
    ]);

    // Get pregnant women count for each anganwadi
    const pregnantWomenCounts = await PregnantWoman.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$anganwadiCenter',
          pregnantWomenCount: { $sum: 1 },
          pregnantWomen: {
            $push: {
              id: '$_id',
              name: '$name',
              age: '$age',
              gestationalAge: '$gestationalAge',
              registrationDate: '$registrationDate'
            }
          }
        }
      }
    ]);

    // Get adolescents count for each anganwadi
    const adolescentsCounts = await Adolescent.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$anganwadiCenter',
          adolescentsCount: { $sum: 1 },
          adolescents: {
            $push: {
              id: '$_id',
              name: '$name',
              age: '$age',
              education: '$education',
              registrationDate: '$registrationDate'
            }
          }
        }
      }
    ]);

    // Combine all data
    const centers = anganwadiData.map(center => {
      const childrenData = childrenCounts.find(c => c._id === center._id) || { childrenCount: 0, children: [] };
      const pregnantWomenData = pregnantWomenCounts.find(p => p._id === center._id) || { pregnantWomenCount: 0, pregnantWomen: [] };
      const adolescentsData = adolescentsCounts.find(a => a._id === center._id) || { adolescentsCount: 0, adolescents: [] };

      return {
        centerName: center._id,
        location: center.address || `${center.district || 'N/A'}`,
        ward: center.ward || 'N/A',
        workerCount: center.workerCount,
        childrenCount: childrenData.childrenCount,
        pregnantWomenCount: pregnantWomenData.pregnantWomenCount,
        adolescentsCount: adolescentsData.adolescentsCount,
        totalBeneficiaries: childrenData.childrenCount + pregnantWomenData.pregnantWomenCount + adolescentsData.adolescentsCount,
        status: center.workerCount > 0 ? 'Active' : 'Inactive',
        workers: center.workers,
        children: childrenData.children,
        pregnantWomen: pregnantWomenData.pregnantWomen,
        adolescents: adolescentsData.adolescents,
        lastUpdated: new Date().toISOString()
      };
    });

    res.json({
      success: true,
      data: {
        centers,
        totalCenters: centers.length,
        activeCenters: centers.filter(c => c.status === 'Active').length,
        filters: { search, ward, status }
      }
    });

  } catch (error) {
    console.error('Anganwadi centers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch anganwadi centers data',
      error: error.message
    });
  }
};

// @desc    Generate PDF report for a specific anganwadi center
// @route   GET /api/reports/anganwadi-centers/:centerName/pdf
// @access  Private (Admin only)
const generateAnganwadiPDF = async (req, res) => {
  try {
    const { centerName } = req.params;
    
    // Get center data
    const workerData = await User.find({
      anganwadiCenter: centerName,
      role: { $in: ['anganwadi-worker', 'asha-volunteer'] }
    }).select('name role phone email status');

    const childrenData = await Child.find({
      anganwadiCenter: centerName,
      status: 'active'
    }).select('name age parentName enrollmentDate currentWeight currentHeight');

    const pregnantWomenData = await PregnantWoman.find({
      anganwadiCenter: centerName,
      status: 'active'
    }).select('name age gestationalAge registrationDate');

    const adolescentsData = await Adolescent.find({
      anganwadiCenter: centerName,
      status: 'active'
    }).select('name age education registrationDate');

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${centerName.replace(/\s+/g, '_')}_Report.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20).text('Anganwadi Center Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).text(`Center: ${centerName}`, { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(2);

    // Add summary statistics
    doc.fontSize(14).text('Summary Statistics', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12)
       .text(`Total Workers: ${workerData.length}`)
       .text(`Total Children: ${childrenData.length}`)
       .text(`Total Pregnant Women: ${pregnantWomenData.length}`)
       .text(`Total Adolescents: ${adolescentsData.length}`)
       .text(`Total Beneficiaries: ${childrenData.length + pregnantWomenData.length + adolescentsData.length}`);
    
    doc.moveDown(2);

    // Add workers section
    if (workerData.length > 0) {
      doc.fontSize(14).text('Workers', { underline: true });
      doc.moveDown();
      
      workerData.forEach((worker, index) => {
        doc.fontSize(10)
           .text(`${index + 1}. ${worker.name} (${worker.role})`)
           .text(`   Phone: ${worker.phone || 'N/A'} | Status: ${worker.status}`)
           .moveDown(0.5);
      });
      doc.moveDown();
    }

    // Add children section
    if (childrenData.length > 0) {
      doc.addPage();
      doc.fontSize(14).text('Children Registered', { underline: true });
      doc.moveDown();
      
      childrenData.forEach((child, index) => {
        doc.fontSize(10)
           .text(`${index + 1}. ${child.name} (Age: ${child.age} years)`)
           .text(`   Parent: ${child.parentName}`)
           .text(`   Enrolled: ${new Date(child.enrollmentDate).toLocaleDateString('en-IN')}`)
           .moveDown(0.5);
      });
    }

    // Add pregnant women section
    if (pregnantWomenData.length > 0) {
      doc.addPage();
      doc.fontSize(14).text('Pregnant Women Registered', { underline: true });
      doc.moveDown();
      
      pregnantWomenData.forEach((woman, index) => {
        doc.fontSize(10)
           .text(`${index + 1}. ${woman.name} (Age: ${woman.age} years)`)
           .text(`   Gestational Age: ${woman.gestationalAge || 'N/A'} weeks`)
           .text(`   Registered: ${new Date(woman.registrationDate).toLocaleDateString('en-IN')}`)
           .moveDown(0.5);
      });
    }

    // Add adolescents section
    if (adolescentsData.length > 0) {
      doc.addPage();
      doc.fontSize(14).text('Adolescents Registered', { underline: true });
      doc.moveDown();
      
      adolescentsData.forEach((adolescent, index) => {
        doc.fontSize(10)
           .text(`${index + 1}. ${adolescent.name} (Age: ${adolescent.age} years)`)
           .text(`   Education: ${adolescent.education || 'N/A'}`)
           .text(`   Registered: ${new Date(adolescent.registrationDate).toLocaleDateString('en-IN')}`)
           .moveDown(0.5);
      });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
      error: error.message
    });
  }
};

// @desc    Generate consolidated PDF report for all anganwadi centers
// @route   GET /api/reports/consolidated-pdf
// @access  Private (Admin only)
const generateConsolidatedPDF = async (req, res) => {
  try {
    // Get all anganwadi centers
    const centers = await User.distinct('anganwadiCenter', {
      role: { $in: ['anganwadi-worker', 'asha-volunteer'] }
    });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="All_Anganwadi_Centers_Report.pdf"');
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20).text('Consolidated Anganwadi Centers Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(2);

    // Process each center
    for (let i = 0; i < centers.length; i++) {
      const centerName = centers[i];
      
      if (i > 0) {
        doc.addPage();
      }

      // Get center data
      const [workerData, childrenData, pregnantWomenData, adolescentsData] = await Promise.all([
        User.find({
          anganwadiCenter: centerName,
          role: { $in: ['anganwadi-worker', 'asha-volunteer'] }
        }).select('name role status'),
        Child.find({
          anganwadiCenter: centerName,
          status: 'active'
        }).select('name age'),
        PregnantWoman.find({
          anganwadiCenter: centerName,
          status: 'active'
        }).select('name age'),
        Adolescent.find({
          anganwadiCenter: centerName,
          status: 'active'
        }).select('name age')
      ]);

      // Add center header
      doc.fontSize(16).text(`${i + 1}. ${centerName}`, { underline: true });
      doc.moveDown();

      // Add summary
      doc.fontSize(12)
         .text(`Workers: ${workerData.length}`)
         .text(`Children: ${childrenData.length}`)
         .text(`Pregnant Women: ${pregnantWomenData.length}`)
         .text(`Adolescents: ${adolescentsData.length}`)
         .text(`Total Beneficiaries: ${childrenData.length + pregnantWomenData.length + adolescentsData.length}`);
      
      doc.moveDown();

      // Add workers list
      if (workerData.length > 0) {
        doc.fontSize(11).text('Workers:', { underline: true });
        workerData.forEach(worker => {
          doc.fontSize(10).text(`• ${worker.name} (${worker.role}) - ${worker.status}`);
        });
        doc.moveDown();
      }

      doc.moveDown();
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Consolidated PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate consolidated PDF report',
      error: error.message
    });
  }
};

// @desc    Get available wards for filtering
// @route   GET /api/reports/wards
// @access  Private (Admin only)
const getWards = async (req, res) => {
  try {
    const wards = await User.distinct('ward', {
      role: { $in: ['anganwadi-worker', 'asha-volunteer'] },
      ward: { $ne: null, $ne: '' }
    });

    res.json({
      success: true,
      data: wards.sort()
    });

  } catch (error) {
    console.error('Get wards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wards',
      error: error.message
    });
  }
};

// Routes
router.get('/dashboard-stats', verifyFirebaseAuth, checkRole(['admin']), getDashboardStats);
router.get('/anganwadi-centers', verifyFirebaseAuth, checkRole(['admin']), getAnganwadiCenters);
router.get('/anganwadi-centers/:centerName/pdf', verifyFirebaseAuth, checkRole(['admin']), generateAnganwadiPDF);
router.get('/consolidated-pdf', verifyFirebaseAuth, checkRole(['admin']), generateConsolidatedPDF);
router.get('/wards', verifyFirebaseAuth, checkRole(['admin']), getWards);

module.exports = router;