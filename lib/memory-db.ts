
import { v4 as uuidv4 } from 'uuid';

// Types matching our Prisma schema roughly
export interface Campaign {
    id: string;
    name: string;
    status: 'Draft' | 'Active' | 'Paused' | 'Completed';
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    // Stats
    sentCount: number;
    openRate: number;
    clickCount: number;
    replyCount: number;
    _count: {
        leads: number;
    }
}

export interface Lead {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    campaignId: string;
    status: 'Lead' | 'Sent' | 'Opened' | 'Replied';
    createdAt: Date;
}

class MemoryDB {
    private campaigns: Campaign[] = [];
    private leads: Lead[] = [];

    constructor() {
        // Seed with initial demo data
        this.createCampaign({ name: "Demo Campaign - LeadGen" });
    }

    // Campaign Methods
    getCampaigns() {
        return this.campaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    getCampaign(id: string) {
        return this.campaigns.find(c => c.id === id);
    }

    createCampaign(data: { name: string }) {
        const newCampaign: Campaign = {
            id: uuidv4(),
            name: data.name,
            status: 'Draft',
            userId: 'demo-user',
            createdAt: new Date(),
            updatedAt: new Date(),
            sentCount: 0,
            openRate: 0,
            clickCount: 0,
            replyCount: 0,
            _count: { leads: 0 }
        };
        this.campaigns.push(newCampaign);
        return newCampaign;
    }

    updateCampaign(id: string, data: Partial<Campaign>) {
        const campaign = this.getCampaign(id);
        if (!campaign) return null;

        Object.assign(campaign, { ...data, updatedAt: new Date() });
        return campaign;
    }

    deleteCampaign(id: string) {
        this.campaigns = this.campaigns.filter(c => c.id !== id);
        this.leads = this.leads.filter(l => l.campaignId !== id);
        return true;
    }

    // Lead Methods
    getLeads(campaignId: string) {
        return this.leads.filter(l => l.campaignId === campaignId);
    }

    addLead(campaignId: string, leadData: { email: string; firstName?: string }) {
        const newLead: Lead = {
            id: uuidv4(),
            campaignId,
            email: leadData.email,
            firstName: leadData.firstName,
            status: 'Lead',
            createdAt: new Date()
        };
        this.leads.push(newLead);

        // Update campaign count
        const campaign = this.getCampaign(campaignId);
        if (campaign) {
            campaign._count.leads = this.leads.filter(l => l.campaignId === campaignId).length;
        }

        return newLead;
    }
}

// Global singleton
export const db = new MemoryDB();
