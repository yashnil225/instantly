import { Queue, Worker, QueueEvents } from 'bullmq'

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
}

export const emailQueue = new Queue('email-sending', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
})

// Worker setup (should be run in a separate process or instrumentation hook)
// export const emailWorker = new Worker('email-sending', async (job) => {
//   console.log(`Processing job ${job.id} of type ${job.name}`);
//   // Call email sending logic here
// }, { connection });

// export const queueEvents = new QueueEvents('email-sending', { connection });
