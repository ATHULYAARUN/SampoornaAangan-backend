const express = require('express');
const router = express.Router();

// In-memory storage for feedback (in production, this would be in MongoDB)
let feedbackStore = [
  {
    id: 1,
    category: 'hygiene',
    subcategory: 'Hand washing facilities',
    subject: 'Need more soap dispensers',
    description: 'The hand washing area often runs out of soap. Children have to wait or use water only. This affects basic hygiene practices.',
    rating: 3,
    priority: 'medium',
    status: 'in_progress',
    submittedAt: '2024-01-15T10:30:00Z',
    response: 'Thank you for your feedback. We are working on installing additional soap dispensers and have ordered automatic dispensers.',
    childName: 'Athulya',
    parentId: 'demo-parent-id',
    parentName: 'Lekha Arun',
    anonymous: false,
    contactPreference: 'email',
    workerName: '',
    suggestion: 'Install automatic soap dispensers to ensure consistent availability.',
    responseAt: '2024-01-16T09:00:00Z'
  },
  {
    id: 2,
    category: 'services',
    subcategory: 'Food quality',
    subject: 'Excellent meal quality',
    description: 'The food served has been consistently good. My child enjoys the meals and comes home satisfied. The variety is also good.',
    rating: 5,
    priority: 'low',
    status: 'acknowledged',
    submittedAt: '2024-01-10T14:20:00Z',
    response: 'We appreciate your positive feedback! Our kitchen staff will be delighted to hear this. We will continue maintaining the quality.',
    childName: 'Athulya',
    parentId: 'demo-parent-id',
    parentName: 'Lekha Arun',
    anonymous: false,
    contactPreference: 'email',
    workerName: 'Mrs. Priya (Cook)',
    suggestion: 'Continue the same quality and maybe introduce seasonal variety.',
    responseAt: '2024-01-11T10:30:00Z'
  },
  {
    id: 3,
    category: 'sanitation',
    subcategory: 'Toilet maintenance',
    subject: 'Toilet door lock broken',
    description: 'The toilet door lock in the girls restroom is broken and needs immediate repair for privacy and safety of children.',
    rating: 2,
    priority: 'high',
    status: 'resolved',
    submittedAt: '2024-01-08T09:15:00Z',
    response: 'Issue has been resolved. New locks have been installed and checked. We have also implemented a weekly maintenance schedule.',
    childName: 'Athulya',
    parentId: 'demo-parent-id',
    parentName: 'Lekha Arun',
    anonymous: false,
    contactPreference: 'phone',
    workerName: '',
    suggestion: 'Regular maintenance schedule for all fixtures.',
    responseAt: '2024-01-09T14:00:00Z'
  },
  {
    id: 4,
    category: 'services',
    subcategory: 'Teaching quality',
    subject: 'Wonderful teaching methods',
    description: 'The teachers use very engaging methods to teach children. My child has learned so much and loves coming to anganwadi.',
    rating: 5,
    priority: 'low',
    status: 'acknowledged',
    submittedAt: '2024-01-12T11:45:00Z',
    response: 'Thank you for appreciating our teaching staff. We will share your feedback with the teachers.',
    childName: 'Akhil',
    parentId: 'demo-parent-id',
    parentName: 'Lekha Arun',
    anonymous: false,
    contactPreference: 'email',
    workerName: 'Mrs. Suma (Teacher)',
    suggestion: 'Keep up the excellent work and maybe organize parent-teacher interaction sessions.',
    responseAt: '2024-01-13T08:30:00Z'
  },
  {
    id: 5,
    category: 'infrastructure',
    subcategory: 'Playground equipment',
    subject: 'Swing needs repair',
    description: 'One of the swings in the playground has a loose chain that could be dangerous for children.',
    rating: 2,
    priority: 'high',
    status: 'in_progress',
    submittedAt: '2024-01-14T16:20:00Z',
    response: 'We have temporarily removed the swing for safety. New equipment will be installed this week.',
    childName: 'Akhil',
    parentId: 'demo-parent-id',
    parentName: 'Lekha Arun',
    anonymous: false,
    contactPreference: 'phone',
    workerName: '',
    suggestion: 'Regular safety inspections of all playground equipment.',
    responseAt: '2024-01-15T07:45:00Z'
  },
  {
    id: 6,
    category: 'hygiene',
    subcategory: 'Classroom cleanliness',
    subject: 'Great cleanliness standards',
    description: 'The classrooms are always clean and well-maintained. Children feel comfortable and healthy environment.',
    rating: 4,
    priority: 'low',
    status: 'acknowledged',
    submittedAt: '2024-01-09T13:30:00Z',
    response: 'Thank you for noticing our efforts. Our cleaning staff works hard to maintain hygiene standards.',
    childName: 'Athulya',
    parentId: 'demo-parent-id',
    parentName: 'Lekha Arun',
    anonymous: false,
    contactPreference: 'email',
    workerName: 'Cleaning Staff',
    suggestion: 'Continue the good work and maybe add some plants for better air quality.',
    responseAt: '2024-01-10T09:15:00Z'
  }
];

// GET /api/feedback - Get all feedback for a user
router.get('/', async (req, res) => {
  try {
    console.log('📋 Getting parent feedback...');
    
    // In production, filter by authenticated user ID
    const userFeedback = feedbackStore.filter(feedback => 
      feedback.parentId === (req.user?.uid || 'demo-parent-id')
    );
    
    console.log(`✅ Found ${userFeedback.length} feedback items`);
    
    res.status(200).json({
      success: true,
      data: {
        feedback: userFeedback,
        total: userFeedback.length,
        stats: {
          total: userFeedback.length,
          pending: userFeedback.filter(f => f.status === 'submitted' || f.status === 'acknowledged').length,
          inProgress: userFeedback.filter(f => f.status === 'in_progress').length,
          resolved: userFeedback.filter(f => f.status === 'resolved').length,
          averageRating: userFeedback.length > 0 ? 
            (userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length).toFixed(1) : 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback',
      error: error.message
    });
  }
});

// POST /api/feedback - Submit new feedback
router.post('/', async (req, res) => {
  try {
    console.log('📝 Submitting new feedback:', req.body);
    
    const {
      category,
      subcategory,
      rating,
      subject,
      description,
      suggestion,
      priority,
      childName,
      workerName,
      contactPreference,
      anonymous
    } = req.body;
    
    // Validate required fields
    if (!category || !rating || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, rating, and description are required fields'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Create new feedback record
    const newFeedback = {
      id: Date.now(),
      category,
      subcategory: subcategory || '',
      subject: subject || 'Feedback',
      description,
      suggestion: suggestion || '',
      rating: parseInt(rating),
      priority: priority || 'medium',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      response: null,
      childName: childName || '',
      workerName: workerName || '',
      parentId: req.user?.uid || 'demo-parent-id',
      anonymous: anonymous || false,
      contactPreference: contactPreference || 'email',
      resolvedAt: null,
      responseAt: null
    };
    
    // Store feedback
    feedbackStore.unshift(newFeedback);
    console.log('✅ Feedback created with ID:', newFeedback.id);
    console.log('📊 Total feedback count:', feedbackStore.length);
    
    // Send acknowledgment response
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully! We will review and respond within 2-3 working days.',
      data: {
        feedback: newFeedback,
        ticketNumber: `FB${newFeedback.id}${Date.now().toString().slice(-4)}`
      }
    });
    
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// GET /api/feedback/:id - Get specific feedback by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Getting feedback by ID:', id);
    
    const feedback = feedbackStore.find(f => 
      f.id === parseInt(id) && f.parentId === (req.user?.uid || 'demo-parent-id')
    );
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { feedback }
    });
    
  } catch (error) {
    console.error('❌ Error getting feedback by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback',
      error: error.message
    });
  }
});

// PUT /api/feedback/:id - Update feedback (if still in submitted status)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Updating feedback:', id);
    
    const feedbackIndex = feedbackStore.findIndex(f => 
      f.id === parseInt(id) && f.parentId === (req.user?.uid || 'demo-parent-id')
    );
    
    if (feedbackIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    const feedback = feedbackStore[feedbackIndex];
    
    // Only allow updates if feedback is still in submitted status
    if (feedback.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update feedback that has already been processed'
      });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'category', 'subcategory', 'rating', 'subject', 'description', 
      'suggestion', 'priority', 'childName', 'workerName', 'contactPreference'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        feedback[field] = req.body[field];
      }
    });
    
    feedback.updatedAt = new Date().toISOString();
    feedbackStore[feedbackIndex] = feedback;
    
    console.log('✅ Feedback updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: { feedback }
    });
    
  } catch (error) {
    console.error('❌ Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
});

// DELETE /api/feedback/:id - Delete feedback (if still in submitted status)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting feedback:', id);
    
    const feedbackIndex = feedbackStore.findIndex(f => 
      f.id === parseInt(id) && f.parentId === (req.user?.uid || 'demo-parent-id')
    );
    
    if (feedbackIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    const feedback = feedbackStore[feedbackIndex];
    
    // Only allow deletion if feedback is still in submitted status
    if (feedback.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete feedback that has already been processed'
      });
    }
    
    feedbackStore.splice(feedbackIndex, 1);
    console.log('✅ Feedback deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
});

// GET /api/feedback/categories/list - Get available feedback categories
router.get('/categories/list', async (req, res) => {
  try {
    console.log('📋 Getting feedback categories...');
    
    const categories = {
      hygiene: {
        label: 'Hygiene & Cleanliness',
        icon: 'Heart',
        color: 'blue',
        subcategories: [
          'Hand washing facilities',
          'Toilet cleanliness',
          'Drinking water quality',
          'Food preparation hygiene',
          'Classroom cleanliness',
          'Personal hygiene of staff',
          'Kitchen hygiene',
          'Playground cleanliness'
        ]
      },
      sanitation: {
        label: 'Sanitation Services',
        icon: 'AlertCircle',
        color: 'green',
        subcategories: [
          'Waste management',
          'Drainage system',
          'Toilet maintenance',
          'Water supply',
          'Cleaning frequency',
          'Soap availability',
          'Dustbin placement',
          'Pest control'
        ]
      },
      services: {
        label: 'Anganwadi Services',
        icon: 'Award',
        color: 'purple',
        subcategories: [
          'Teaching quality',
          'Food quality',
          'Health checkups',
          'Staff behavior',
          'Timing & schedule',
          'Communication with parents',
          'Activity programs',
          'Safety measures'
        ]
      },
      infrastructure: {
        label: 'Infrastructure',
        icon: 'Target',
        color: 'orange',
        subcategories: [
          'Building condition',
          'Classroom facilities',
          'Playground equipment',
          'Furniture condition',
          'Lighting',
          'Ventilation',
          'Safety equipment',
          'Accessibility'
        ]
      }
    };
    
    res.status(200).json({
      success: true,
      data: { categories }
    });
    
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

module.exports = router;