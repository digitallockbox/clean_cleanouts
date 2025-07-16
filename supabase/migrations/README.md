# Database Schema Setup Instructions

## Complete Fresh Setup

This directory contains a single, complete database schema file that replaces all previous migration files.

### Steps to Setup:

1. **Delete All Existing Tables in Supabase**
   - Go to your Supabase dashboard
   - Navigate to Table Editor
   - Delete all existing tables (if any)

2. **Run the Complete Schema**
   ```bash
   # Navigate to your project directory
   cd your-project-directory
   
   # Run the complete schema migration
   supabase db reset
   # OR manually run the SQL file in Supabase SQL Editor
   ```

3. **Alternative: Manual Setup**
   - Copy the contents of `complete_schema.sql`
   - Paste into Supabase SQL Editor
   - Execute the script

### What This Schema Includes:

#### Core Tables:
- **profiles** - User profile information
- **service_categories** - Service categorization
- **services** - Available services with pricing
- **bookings** - Customer bookings with full lifecycle
- **website_settings** - Dynamic website configuration
- **contact_submissions** - Contact form submissions

#### Advanced Features:
- **user_preferences** - User notification preferences
- **payment_methods** - Saved payment methods (Stripe integration)
- **service_reviews** - Customer reviews and ratings
- **email_logs** - Email tracking and delivery status
- **notifications** - In-app user notifications
- **payments** - Payment records and transaction history

#### Security & Performance:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Comprehensive security policies
- ✅ Performance indexes on all critical columns
- ✅ Automatic timestamp updates
- ✅ Data validation constraints

#### Default Data:
- Service categories (Junk Removal, Moving Services, etc.)
- Sample services with realistic pricing
- Website settings with branding
- Contact information

### Database Features:

1. **Automatic Profile Creation**
   - User profiles are automatically created when users sign up
   - User preferences are initialized with defaults

2. **Payment Method Management**
   - Supports multiple payment methods per user
   - Automatic default payment method handling
   - Stripe integration ready

3. **Booking Lifecycle**
   - Complete booking status tracking
   - Payment status integration
   - Customer information storage

4. **Review System**
   - Users can only review completed bookings
   - Verified and featured review support
   - Rating system (1-5 stars)

5. **Notification System**
   - In-app notifications
   - Email tracking and delivery status
   - User preference-based notifications

### Production Ready:
This schema is production-ready and includes:
- All necessary constraints and validations
- Proper foreign key relationships
- Optimized indexes for performance
- Comprehensive security policies
- Automatic data management functions

### Next Steps After Setup:
1. Verify all tables are created successfully
2. Test user registration and profile creation
3. Add your first service categories and services
4. Configure Stripe webhook endpoints
5. Test the booking flow end-to-end

### Support:
If you encounter any issues during setup, check:
1. Supabase project permissions
2. RLS policies are properly applied
3. All foreign key relationships are intact
4. Default data was inserted successfully