# KYD Guest List Manager

A streamlined guest list management tool for music venues, built with Next.js and Supabase. The goal is simple: take CSV guest lists from venues and turn them into easily shareable, standardized lists.

## Why This Stack?

I wanted to build something that's both powerful and maintainable. The tech choices reflect that:

### Frontend Stack
- ✅ Next.js 14 (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Shadcn/UI Components
- ✅ Framer Motion (Page Transitions)

Next.js was a no-brainer. The new App Router gives us a solid foundation for both static and dynamic routes, plus built-in API routes eliminate the need for a separate backend service. TypeScript keeps our code type-safe and maintainable, while Tailwind and Shadcn/UI let us build a beautiful UI without reinventing the wheel.

### Backend Infrastructure
- ✅ Supabase (PostgreSQL)
- ✅ AWS S3 (CSV Storage)
- ✅ Vercel Functions (API Routes)


Supabase gives us the power of PostgreSQL with a delightful developer experience. The real-time capabilities and row-level security will be crucial for future features like live guest list updates and venue-specific access control.

#### 1. CSV Upload
- ✅ S3 Integration with Presigned URLs
- ✅ Drag-and-drop Upload Interface
- ✅ File Validation

#### 2. Column Mapping
- ✅ Column Mapping Interface
- ✅ Preview Capability

Required Fields:
- First Name (Required)
- Last Name (Optional)
- Number of Tickets (Optional, defaults to 1)
- Notes (Optional)
- Email (Optional) [I added this]

1. **Direct S3 Upload**
   ```
   1. Client requests presigned URL
   ⇩
   2. Server generates URL with temporary credentials
   ⇩
   3. Client uploads directly to S3
   ⇩
   4. File reference stored in Supabase
   ☑️
   ```

2. **Column Mapping**
   - Interactive UI for mapping CSV columns to standardized fields
   - Smart detection of numeric columns
   - Validation of required fields (First Name)
   - Default value handling (e.g., Number of Tickets defaults to 1)

3. **Data Processing**
   - Server-side validation
   - Batch processing for large guest lists
   - Error handling with feedback
   - Automatic generation of share tokens

### Database Schema

```typescript
interface GuestList {
  id: string;                // UUID
  created_at: string;        // Timestamp
  original_filename: string; // Original CSV name
  s3_key: string;           // S3 file reference
  share_token: string;      // Public access token
  event_date: string;       // Event date
  status: 'draft' | 'ready' // Processing status
}

interface Guest {
  id: string;           // UUID
  guest_list_id: string;// Reference to parent list
  first_name: string;   // Required
  last_name?: string;   // Optional
  email?: string;       // Optional
  num_tickets: number;  // Defaults to 1
  notes?: string;       // Optional
}
```

The schema is designed to be flexible yet structured. Each guest list can be in either a 'draft' state (during column mapping) or 'ready' state (after processing). This allows for a smooth upload experience with proper error handling.

- ⇩ ~~AWS Lambda/API Gateway Setup~~
- ✅ Deployment to Vercel; very simple CI/CD config.

## Key Features Implementation Status

#### 1. CSV Upload
- ✅ S3 Integration with Presigned URLs
- ✅ Drag-and-drop Upload Interface
- ✅ Progress Indicator
- ⬜ File Validation

#### 2. Column Mapping
- ✅ Interactive Column Mapper
- ✅ Smart Column Type Detection
- ✅ Required Field Validation
- ⬜ Preview Capability

#### 3. Data Storage
- ✅ Database Schema
- ✅ Batch Processing
- ✅ Error Handling
- ⬜ Duplicate Detection

#### 4. Sharable Links
- ✅ Token Generation
- ✅ Public View Interface
- ✅ Mobile Responsive Design
- ⬜ Access Controls
## Next Steps

1. **Enhanced Validation**
   - Duplicate entry detection
   - CSV format validation
   - Custom validation rules per venue

2. **Access Controls**
   - Venue-specific authentication
   - Row-level security
   - Audit logging

3. **Real-time Updates**
   - Live guest list modifications
   - Collaborative editing
   - Change history

## Contributing

This is a prototype project for KYD's internal use. Feel free to fork and adapt for your needs, but note that this is not intended for general public use.

## License

Private - KYD Internal Use Only
