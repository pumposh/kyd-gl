# KYD Guest List Manager

A streamlined guest list management tool for music venues, built with Next.js and Supabase.

## Architecture Overview

### Frontend Stack
- ✅ Next.js
- ✅ TypeScript
- ✅ Tailwind
- ✅ Shadcn/UI Components
- ✅ Framer Motion (Page Transitions)

> These were all built into a template I lean on for new projects.

### Backend Infrastructure
- ✅ Supabase
- ✅ AWS S3 (CSV Storage)
- ⬜ Database Schema (Pending)
- ⬜ API Routes (In Progress)

> I'd heard great things about Supabase which under the hood uses Postgres, so quick to design schema and query potentially large amounts of data.

### Key Features Implementation Status

#### 1. CSV Upload
- ✅ S3 Integration with Presigned URLs
- ⬜ Drag-and-drop Upload Interface
- ⬜ File Validation
- ⬜ Progress Indicator

#### 2. Column Mapping
- ⬜ Column Mapping Interface
- ⬜ Field Validation
- ⬜ Default Value Handling
- ⬜ Preview Capability

Required Fields:
- First Name (Required)
- Last Name (Optional)
- Number of Tickets (Optional, defaults to 1)
- Notes (Optional)

#### 3. Data Storage
- ⬜ Database Schema Design
- ⬜ Data Validation
- ⬜ Error Handling
- ⬜ Success Confirmation

#### 4. Sharable Links
- ⬜ Link Generation
- ⬜ Public View Interface
- ⬜ List Display Format
- ⬜ Mobile Responsiveness

## Technical Implementation Details

### AWS S3 Integration

Direct Upload Flow using Presigned URLs
```
1. Client requests presigned URL
⇩
2. Server generates URL
⇩
3. Client uploads directly to S3 using the URL
⇩
4. Server processes uploaded file
☑️
```

### Database Schema (Planned)
```typescript
/** Planned Schema */

interface GuestList {
  id: string;  // UUID
  created_at: Date;
  original_filename: string;
  s3_key: string;
  share_token: string;
  event_date: Date;
}

interface Guest {
  id: string;  // UUID
  guest_list_id: string;  // UUID reference to GuestList
  first_name: string;
  last_name?: string;
  email?: string;
  num_tickets: number;
  notes?: string;
}
```

## Deployment

- ⇩ ~~AWS Lambda/API Gateway Setup~~
- ✅ Deployment to Vercel; very simple CI/CD config.

## Next Steps

1. Implement CSV Upload Interface
   - Drag-and-drop functionality
   - File validation
   - Upload progress

2. Build Column Mapping UI
   - Interactive column matcher
   - Preview capability
   - Validation feedback

3. Setup Database
   - Implement schema
   - Add data validation
   - Error handling

4. Create Sharable Links System
   - Generate unique tokens
   - Public view interface
   - Mobile-responsive design

## Contributing

This is a prototype project. 

## License

Private - KYD Internal Use Only
