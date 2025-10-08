// Script to update existing system settings with new default values
// Run with: node update-default-settings.js

const mongoose = require('mongoose');
require('dotenv').config();

// Import the SystemSettings model
const SystemSettings = require('./models/SystemSettings');

async function updateDefaultSettings() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📁 Connected to MongoDB');

        // Find existing settings
        let settings = await SystemSettings.findOne();

        if (settings) {
            console.log('✅ Found existing settings, updating default values...');
            
            // Update the general section with new defaults
            if (!settings.general.panchayatName || settings.general.panchayatName === '') {
                settings.general.panchayatName = 'Elikkulam';
            }
            
            if (!settings.general.district || settings.general.district === '') {
                settings.general.district = 'Kottayam';
            }
            
            if (!settings.general.state || settings.general.state === '') {
                settings.general.state = 'Kerala';
            }

            // Mark the general section as modified for proper saving
            settings.markModified('general');
            
            // Save the updated settings
            await settings.save();
            
            console.log('🎉 Settings updated successfully!');
            console.log('📍 Panchayat Name:', settings.general.panchayatName);
            console.log('📍 District:', settings.general.district);
            console.log('📍 State:', settings.general.state);
        } else {
            console.log('⚠️  No existing settings found. Creating new settings with defaults...');
            
            // Create new settings with defaults (the model defaults will apply)
            settings = new SystemSettings();
            await settings.save();
            
            console.log('✅ New settings created with default values!');
            console.log('📍 Panchayat Name:', settings.general.panchayatName);
            console.log('📍 District:', settings.general.district);
            console.log('📍 State:', settings.general.state);
        }

    } catch (error) {
        console.error('❌ Error updating settings:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('📁 Database connection closed');
        process.exit(0);
    }
}

// Run the update
updateDefaultSettings();