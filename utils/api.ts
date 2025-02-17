import { GuestList } from './db'

type ColumnPositions = Record<string, number>

interface CreateGuestListParams {
  original_filename: string
  s3_key: string
  status: 'draft' | 'ready'
  event_date: string
}

class ApiError extends Error {
  status?: number
  
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class GuestListApi {
  static async createGuestList(params: CreateGuestListParams): Promise<GuestList> {
    try {
      const response = await fetch('/api/guest-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new ApiError(error.error || 'Failed to create guest list', response.status)
      }

      return response.json()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to create guest list')
    }
  }

  static async processGuestList(id: string, positions: ColumnPositions): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/guest-lists/${id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ positions }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new ApiError(error.error || 'Failed to process guest list', response.status)
      }

      return response.json()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to process guest list')
    }
  }

  static async getPresignedUrl(filename: string, operation: 'read' | 'write' = 'write'): Promise<{ url: string, key: string }> {
    try {
      const response = await fetch('/api/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          filename,
          operation
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new ApiError(error.error || 'Failed to get presigned URL', response.status)
      }

      return response.json()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to get presigned URL')
    }
  }

  static async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      // Get presigned URL
      const { url, key } = await this.getPresignedUrl(file.name)
      
      // Upload to S3
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/csv',
        },
        body: file,
      })

      if (!response.ok) {
        throw new ApiError('Upload failed', response.status)
      }

      // Call progress callback with 100% when done
      onProgress?.(100)
      
      return key
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to upload file')
    }
  }
} 