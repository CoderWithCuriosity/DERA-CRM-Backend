// services/importRedisService.ts
import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Connect to Redis
(async () => {
    await redisClient.connect();
})();

export interface ImportStatus {
    import_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total: number;
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
    completed_at?: string;
    started_at: string;
    updated_at: string;
}

// Define the update type
export type ImportStatusUpdate = Partial<Omit<ImportStatus, 'import_id' | 'started_at' | 'updated_at'>> & {
    processed?: number;
    successful?: number;
    failed?: number;
    errors?: Array<{ row: number; error: string }>;
    status?: 'processing' | 'completed' | 'failed';
    total?: number;
    completed_at?: string;
};

export const importRedisService = {
    // Store import status in Redis with 1 hour expiration
    async setImportStatus(importId: string, status: Partial<ImportStatus>) {
        const key = `import:${importId}`;
        const existing = await this.getImportStatus(importId);

        const importStatus: ImportStatus = {
            import_id: importId,
            status: 'pending',
            total: 0,
            processed: 0,
            successful: 0,
            failed: 0,
            errors: [],
            started_at: existing?.started_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...existing,
            ...status
        } as ImportStatus;

        await redisClient.setEx(key, 3600, JSON.stringify(importStatus)); // Expire after 1 hour
        return importStatus;
    },

    // Get import status
    async getImportStatus(importId: string): Promise<ImportStatus | null> {
        const key = `import:${importId}`;
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    },

    // Update import progress - FIXED: Use the ImportStatusUpdate type
    async updateImportProgress(importId: string, updates: ImportStatusUpdate) {
        const status = await this.getImportStatus(importId);
        if (!status) return null;

        const updatedStatus: ImportStatus = {
            ...status,
            ...updates,
            updated_at: new Date().toISOString()
        };

        if (updates.status === 'completed' || updates.status === 'failed') {
            updatedStatus.completed_at = new Date().toISOString();
        }

        await redisClient.setEx(`import:${importId}`, 3600, JSON.stringify(updatedStatus));
        return updatedStatus;
    },

    // Delete import status
    async deleteImportStatus(importId: string) {
        await redisClient.del(`import:${importId}`);
    }
};