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
    }).select('name role phone email status ward district address');

    const childrenData = await Child.find({
      anganwadiCenter: centerName,
      status: 'active'
    }).select('name age parentName enrollmentDate currentWeight currentHeight gender address');

    const pregnantWomenData = await PregnantWoman.find({
      anganwadiCenter: centerName,
      status: 'active'
    }).select('name age gestationalAge registrationDate expectedDeliveryDate');

    const adolescentsData = await Adolescent.find({
      anganwadiCenter: centerName,
      status: 'active'
    }).select('name age education registrationDate');

    const newbornData = await Newborn.find({
      anganwadiCenter: centerName,
      status: 'active'
    }).select('name age parentName registrationDate birthWeight currentWeight');

    // Create PDF document with better formatting
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4',
      info: {
        Title: `${centerName} - Anganwadi Center Report`,
        Author: 'SampoornaAngan System',
        Subject: 'Anganwadi Center Comprehensive Report'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${centerName.replace(/\s+/g, '_')}_Detailed_Report.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to add header
    const addHeader = () => {
      doc.rect(40, 40, doc.page.width - 80, 80).fill('#f8f9fa');
      doc.fillColor('#000000');
      doc.fontSize(24).font('Helvetica-Bold').text('ANGANWADI CENTER REPORT', 60, 60, { align: 'center' });
      doc.fontSize(18).font('Helvetica').text(centerName, 60, 85, { align: 'center' });
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 60, 105, { align: 'center' });
      doc.moveDown(3);
    };

    // Add header
    addHeader();

    // Executive Summary Box
    doc.rect(40, doc.y, doc.page.width - 80, 120).stroke('#e5e7eb');
    doc.fontSize(16).font('Helvetica-Bold').text('EXECUTIVE SUMMARY', 60, doc.y + 10);
    doc.moveDown();

    const totalBeneficiaries = childrenData.length + pregnantWomenData.length + adolescentsData.length + newbornData.length;
    
    doc.fontSize(12).font('Helvetica')
       .text(`📊 Total Workers: ${workerData.length}`, 60, doc.y)
       .text(`👶 Total Children: ${childrenData.length}`, 200, doc.y - 15)
       .text(`🤰 Pregnant Women: ${pregnantWomenData.length}`, 340, doc.y - 15)
       .text(`👧 Adolescents: ${adolescentsData.length}`, 60, doc.y + 10)
       .text(`🍼 Newborns: ${newbornData.length}`, 200, doc.y - 5)
       .text(`📈 Total Beneficiaries: ${totalBeneficiaries}`, 340, doc.y - 5);
    
    doc.moveDown(4);

    // Center Information
    if (workerData.length > 0) {
      const firstWorker = workerData[0];
      doc.fontSize(14).font('Helvetica-Bold').text('CENTER INFORMATION', { underline: true });
      doc.moveDown();
      doc.fontSize(11).font('Helvetica')
         .text(`📍 Address: ${firstWorker.address || 'N/A'}`)
         .text(`🏘️ Ward: ${firstWorker.ward || 'N/A'}`)
         .text(`🏙️ District: ${firstWorker.district || 'N/A'}`)
         .text(`⭐ Status: ${workerData.filter(w => w.status === 'active').length > 0 ? 'Active' : 'Inactive'}`);
      doc.moveDown(2);
    }

    // Workers Section with improved formatting
    if (workerData.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('STAFF DETAILS', { underline: true });
      doc.moveDown();
      
      // Create table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('S.No', 60, doc.y);
      doc.text('Name', 100, doc.y - 12);
      doc.text('Role', 250, doc.y - 12);
      doc.text('Phone', 350, doc.y - 12);
      doc.text('Status', 450, doc.y - 12);
      doc.moveTo(60, doc.y + 5).lineTo(540, doc.y + 5).stroke();
      doc.moveDown();

      workerData.forEach((worker, index) => {
        doc.fontSize(9).font('Helvetica');
        const yPos = doc.y;
        doc.text(`${index + 1}`, 60, yPos);
        doc.text(worker.name, 100, yPos);
        doc.text(worker.role === 'anganwadi-worker' ? 'AWW' : 'ASHA', 250, yPos);
        doc.text(worker.phone || 'N/A', 350, yPos);
        doc.text(worker.status, 450, yPos);
        doc.moveDown(0.8);
      });
      doc.moveDown();
    }

    // Children Section with detailed information
    if (childrenData.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('CHILDREN ENROLLED', { underline: true });
      doc.moveDown();
      
      // Age distribution
      const ageGroups = {
        '0-2 years': childrenData.filter(c => c.age <= 2).length,
        '3-5 years': childrenData.filter(c => c.age >= 3 && c.age <= 5).length,
        '6+ years': childrenData.filter(c => c.age > 5).length
      };

      doc.fontSize(12).font('Helvetica')
         .text(`Age Distribution: 0-2 years (${ageGroups['0-2 years']}), 3-5 years (${ageGroups['3-5 years']}), 6+ years (${ageGroups['6+ years']})`);
      doc.moveDown();

      // Children table
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('S.No', 60, doc.y);
      doc.text('Name', 100, doc.y - 10);
      doc.text('Age', 200, doc.y - 10);
      doc.text('Parent', 230, doc.y - 10);
      doc.text('Gender', 350, doc.y - 10);
      doc.text('Enrollment Date', 400, doc.y - 10);
      doc.moveTo(60, doc.y + 5).lineTo(540, doc.y + 5).stroke();
      doc.moveDown();
      
      childrenData.forEach((child, index) => {
        if (doc.y > 700) {
          doc.addPage();
          doc.moveDown();
        }
        
        doc.fontSize(8).font('Helvetica');
        const yPos = doc.y;
        doc.text(`${index + 1}`, 60, yPos);
        doc.text(child.name, 100, yPos);
        doc.text(`${child.age}y`, 200, yPos);
        doc.text(child.parentName || 'N/A', 230, yPos);
        doc.text(child.gender || 'N/A', 350, yPos);
        doc.text(new Date(child.enrollmentDate).toLocaleDateString('en-IN'), 400, yPos);
        doc.moveDown(0.7);
      });
      doc.moveDown();
    }

    // Pregnant Women Section
    if (pregnantWomenData.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('PREGNANT WOMEN', { underline: true });
      doc.moveDown();
      
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('S.No', 60, doc.y);
      doc.text('Name', 100, doc.y - 10);
      doc.text('Age', 200, doc.y - 10);
      doc.text('Gestational Age', 240, doc.y - 10);
      doc.text('Expected Delivery', 340, doc.y - 10);
      doc.text('Registration Date', 450, doc.y - 10);
      doc.moveTo(60, doc.y + 5).lineTo(540, doc.y + 5).stroke();
      doc.moveDown();
      
      pregnantWomenData.forEach((woman, index) => {
        if (doc.y > 700) {
          doc.addPage();
          doc.moveDown();
        }
        
        doc.fontSize(8).font('Helvetica');
        const yPos = doc.y;
        doc.text(`${index + 1}`, 60, yPos);
        doc.text(woman.name, 100, yPos);
        doc.text(`${woman.age}y`, 200, yPos);
        doc.text(`${woman.gestationalAge || 'N/A'} weeks`, 240, yPos);
        doc.text(woman.expectedDeliveryDate ? new Date(woman.expectedDeliveryDate).toLocaleDateString('en-IN') : 'N/A', 340, yPos);
        doc.text(new Date(woman.registrationDate).toLocaleDateString('en-IN'), 450, yPos);
        doc.moveDown(0.7);
      });
      doc.moveDown();
    }

    // Adolescents Section
    if (adolescentsData.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('ADOLESCENTS', { underline: true });
      doc.moveDown();
      
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('S.No', 60, doc.y);
      doc.text('Name', 100, doc.y - 10);
      doc.text('Age', 200, doc.y - 10);
      doc.text('Education Level', 250, doc.y - 10);
      doc.text('Registration Date', 400, doc.y - 10);
      doc.moveTo(60, doc.y + 5).lineTo(540, doc.y + 5).stroke();
      doc.moveDown();
      
      adolescentsData.forEach((adolescent, index) => {
        if (doc.y > 700) {
          doc.addPage();
          doc.moveDown();
        }
        
        doc.fontSize(8).font('Helvetica');
        const yPos = doc.y;
        doc.text(`${index + 1}`, 60, yPos);
        doc.text(adolescent.name, 100, yPos);
        doc.text(`${adolescent.age}y`, 200, yPos);
        doc.text(adolescent.education || 'N/A', 250, yPos);
        doc.text(new Date(adolescent.registrationDate).toLocaleDateString('en-IN'), 400, yPos);
        doc.moveDown(0.7);
      });
      doc.moveDown();
    }

    // Newborns Section
    if (newbornData.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('NEWBORNS', { underline: true });
      doc.moveDown();
      
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('S.No', 60, doc.y);
      doc.text('Name', 100, doc.y - 10);
      doc.text('Age (months)', 200, doc.y - 10);
      doc.text('Parent', 280, doc.y - 10);
      doc.text('Birth Weight', 380, doc.y - 10);
      doc.text('Current Weight', 460, doc.y - 10);
      doc.moveTo(60, doc.y + 5).lineTo(540, doc.y + 5).stroke();
      doc.moveDown();
      
      newbornData.forEach((newborn, index) => {
        if (doc.y > 700) {
          doc.addPage();
          doc.moveDown();
        }
        
        doc.fontSize(8).font('Helvetica');
        const yPos = doc.y;
        doc.text(`${index + 1}`, 60, yPos);
        doc.text(newborn.name, 100, yPos);
        doc.text(`${newborn.age || 0}m`, 200, yPos);
        doc.text(newborn.parentName || 'N/A', 280, yPos);
        doc.text(`${newborn.birthWeight || 'N/A'}kg`, 380, yPos);
        doc.text(`${newborn.currentWeight || 'N/A'}kg`, 460, yPos);
        doc.moveDown(0.7);
      });
    }

    // Footer
    doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('REPORT SUMMARY', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica')
       .text(`This comprehensive report for ${centerName} includes detailed information about all registered beneficiaries and staff members.`)
       .text(`Report generated on ${new Date().toLocaleString('en-IN')} by SampoornaAngan System.`)
       .text('For any queries or updates, please contact the system administrator.', { align: 'center' });

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
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4',
      info: {
        Title: 'Consolidated Anganwadi Centers Report',
        Author: 'SampoornaAngan System',
        Subject: 'All Anganwadi Centers Comprehensive Report'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Consolidated_Anganwadi_Centers_Report.pdf"');
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.rect(40, 40, doc.page.width - 80, 80).fill('#2563eb');
    doc.fillColor('#ffffff');
    doc.fontSize(24).font('Helvetica-Bold').text('CONSOLIDATED REPORT', 60, 60, { align: 'center' });
    doc.fontSize(18).text('All Anganwadi Centers', 60, 85, { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 60, 105, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(4);

    // Calculate overall statistics
    let totalStats = {
      totalCenters: centers.length,
      totalWorkers: 0,
      totalChildren: 0,
      totalPregnantWomen: 0,
      totalAdolescents: 0,
      totalNewborns: 0
    };

    const centerDetails = [];

    // Collect data for all centers
    for (const centerName of centers) {
      const [workerData, childrenData, pregnantWomenData, adolescentsData, newbornData] = await Promise.all([
        User.find({
          anganwadiCenter: centerName,
          role: { $in: ['anganwadi-worker', 'asha-volunteer'] }
        }).select('name role status ward district'),
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
        }).select('name age'),
        Newborn.find({
          anganwadiCenter: centerName,
          status: 'active'
        }).select('name age')
      ]);

      const centerData = {
        name: centerName,
        workers: workerData,
        children: childrenData,
        pregnantWomen: pregnantWomenData,
        adolescents: adolescentsData,
        newborns: newbornData,
        ward: workerData[0]?.ward || 'N/A',
        district: workerData[0]?.district || 'N/A'
      };

      centerDetails.push(centerData);

      // Update totals
      totalStats.totalWorkers += workerData.length;
      totalStats.totalChildren += childrenData.length;
      totalStats.totalPregnantWomen += pregnantWomenData.length;
      totalStats.totalAdolescents += adolescentsData.length;
      totalStats.totalNewborns += newbornData.length;
    }

    // Executive Summary
    doc.rect(40, doc.y, doc.page.width - 80, 140).stroke('#e5e7eb');
    doc.fontSize(16).font('Helvetica-Bold').text('EXECUTIVE SUMMARY', 60, doc.y + 15);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica')
       .text(`🏢 Total Centers: ${totalStats.totalCenters}`, 60, doc.y + 10)
       .text(`👥 Total Workers: ${totalStats.totalWorkers}`, 200, doc.y - 5)
       .text(`👶 Children: ${totalStats.totalChildren}`, 350, doc.y - 5)
       .text(`🤰 Pregnant Women: ${totalStats.totalPregnantWomen}`, 60, doc.y + 15)
       .text(`👧 Adolescents: ${totalStats.totalAdolescents}`, 200, doc.y - 5)
       .text(`🍼 Newborns: ${totalStats.totalNewborns}`, 350, doc.y - 5);

    const totalBeneficiaries = totalStats.totalChildren + totalStats.totalPregnantWomen + totalStats.totalAdolescents + totalStats.totalNewborns;
    doc.fontSize(14).font('Helvetica-Bold')
       .text(`📊 TOTAL BENEFICIARIES: ${totalBeneficiaries}`, 60, doc.y + 20, { align: 'center' });

    doc.moveDown(4);

    // Centers Overview Table
    doc.fontSize(14).font('Helvetica-Bold').text('CENTERS OVERVIEW', { underline: true });
    doc.moveDown();

    // Table header
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('S.No', 50, doc.y);
    doc.text('Center Name', 80, doc.y - 10);
    doc.text('Ward', 200, doc.y - 10);
    doc.text('Workers', 240, doc.y - 10);
    doc.text('Children', 280, doc.y - 10);
    doc.text('Pregnant', 320, doc.y - 10);
    doc.text('Adolescents', 360, doc.y - 10);
    doc.text('Newborns', 410, doc.y - 10);
    doc.text('Total', 450, doc.y - 10);
    doc.moveTo(50, doc.y + 5).lineTo(500, doc.y + 5).stroke();
    doc.moveDown();

    // Table rows
    centerDetails.forEach((center, index) => {
      if (doc.y > 700) {
        doc.addPage();
        doc.moveDown();
      }

      const totalBenef = center.children.length + center.pregnantWomen.length + center.adolescents.length + center.newborns.length;
      
      doc.fontSize(8).font('Helvetica');
      const yPos = doc.y;
      doc.text(`${index + 1}`, 50, yPos);
      doc.text(center.name.length > 20 ? center.name.substring(0, 20) + '...' : center.name, 80, yPos);
      doc.text(center.ward, 200, yPos);
      doc.text(center.workers.length.toString(), 240, yPos);
      doc.text(center.children.length.toString(), 280, yPos);
      doc.text(center.pregnantWomen.length.toString(), 320, yPos);
      doc.text(center.adolescents.length.toString(), 360, yPos);
      doc.text(center.newborns.length.toString(), 410, yPos);
      doc.text(totalBenef.toString(), 450, yPos);
      doc.moveDown(0.8);
    });

    doc.moveDown(2);

    // Detailed Center Information
    centerDetails.forEach((center, index) => {
      doc.addPage();
      
      // Center header
      doc.fontSize(18).font('Helvetica-Bold').text(`${index + 1}. ${center.name}`, { underline: true });
      doc.moveDown();

      // Center info box
      doc.rect(40, doc.y, doc.page.width - 80, 60).stroke('#e5e7eb');
      doc.fontSize(11).font('Helvetica')
         .text(`📍 Ward: ${center.ward} | District: ${center.district}`, 60, doc.y + 10)
         .text(`👥 Workers: ${center.workers.length} | 👶 Children: ${center.children.length} | 🤰 Pregnant Women: ${center.pregnantWomen.length}`, 60, doc.y + 15)
         .text(`👧 Adolescents: ${center.adolescents.length} | 🍼 Newborns: ${center.newborns.length}`, 60, doc.y + 15);
      
      doc.moveDown(3);

      // Workers section
      if (center.workers.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Staff Members:', { underline: true });
        doc.moveDown(0.5);
        
        center.workers.forEach((worker, i) => {
          doc.fontSize(10).font('Helvetica')
             .text(`${i + 1}. ${worker.name} - ${worker.role === 'anganwadi-worker' ? 'Anganwadi Worker' : 'ASHA Volunteer'} (${worker.status})`);
        });
        doc.moveDown();
      }

      // Age distribution for children
      if (center.children.length > 0) {
        const ageGroups = {
          '0-2': center.children.filter(c => c.age <= 2).length,
          '3-5': center.children.filter(c => c.age >= 3 && c.age <= 5).length,
          '6+': center.children.filter(c => c.age > 5).length
        };

        doc.fontSize(12).font('Helvetica-Bold').text('Children Age Distribution:', { underline: true });
        doc.fontSize(10).font('Helvetica')
           .text(`0-2 years: ${ageGroups['0-2']} | 3-5 years: ${ageGroups['3-5']} | 6+ years: ${ageGroups['6+']}`);
        doc.moveDown();
      }

      // Quick stats
      const centerTotalBenef = center.children.length + center.pregnantWomen.length + center.adolescents.length + center.newborns.length;
      doc.fontSize(11).font('Helvetica-Bold')
         .text(`📊 Center Performance: ${centerTotalBenef} total beneficiaries served`)
         .text(`🎯 Worker-to-Beneficiary Ratio: ${center.workers.length > 0 ? Math.round(centerTotalBenef / center.workers.length) : 0}:1`);
    });

    // Final summary page
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('SYSTEM OVERVIEW & RECOMMENDATIONS', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).font('Helvetica')
       .text('📊 KEY METRICS:')
       .text(`• Average beneficiaries per center: ${Math.round(totalBeneficiaries / totalStats.totalCenters)}`)
       .text(`• Average workers per center: ${Math.round(totalStats.totalWorkers / totalStats.totalCenters)}`)
       .text(`• Overall worker-to-beneficiary ratio: ${Math.round(totalBeneficiaries / totalStats.totalWorkers)}:1`)
       .moveDown()
       .text('🎯 RECOMMENDATIONS:')
       .text('• Regular monitoring of beneficiary growth patterns')
       .text('• Ensure adequate staff coverage across all centers')
       .text('• Implement data quality checks for better reporting')
       .text('• Schedule periodic health assessments')
       .moveDown()
       .text('📋 REPORT NOTES:')
       .text('• This report includes only active beneficiaries and staff')
       .text('• Data is current as of the report generation date')
       .text('• For detailed individual records, refer to center-specific reports');

    doc.moveDown(2);
    doc.fontSize(10).text(`Report compiled by SampoornaAngan System on ${new Date().toLocaleString('en-IN')}`, { align: 'center', oblique: true });

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