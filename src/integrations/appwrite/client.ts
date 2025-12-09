import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);

export const APPWRITE_CONFIG = {
    DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    EXPENSES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_EXPENSES_COLLECTION_ID,
    MONTHLY_SAVINGS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_MONTHLY_SAVINGS_COLLECTION_ID,
    INCOMES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_INCOMES_COLLECTION_ID,
};
