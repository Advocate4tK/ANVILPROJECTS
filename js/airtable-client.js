/**
 * Airtable API Client
 *
 * This module handles all communication with the Airtable API.
 * It provides methods to create, read, update, and delete records.
 */

class AirtableClient {
    constructor(config) {
        if (!config || !config.AIRTABLE_API_KEY || !config.AIRTABLE_BASE_ID) {
            throw new Error('Airtable configuration is missing. Please set up config.js');
        }

        this.apiKey = config.AIRTABLE_API_KEY;
        this.baseId = config.AIRTABLE_BASE_ID;
        this.apiUrl = config.AIRTABLE_API_URL || 'https://api.airtable.com/v0';
        this.tables = config.AIRTABLE_TABLES;
    }

    /**
     * Get the full URL for a table
     */
    getTableUrl(tableName) {
        return `${this.apiUrl}/${this.baseId}/${tableName}`;
    }

    /**
     * Get request headers with authentication
     */
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Create a new record in a table
     *
     * @param {string} tableName - Name of the table
     * @param {object} fields - Object containing field names and values
     * @returns {Promise<object>} - Created record data
     */
    async createRecord(tableName, fields) {
        try {
            const url = this.getTableUrl(tableName);
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    fields: fields
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to create record');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating record:', error);
            throw error;
        }
    }

    /**
     * Get records from a table
     *
     * @param {string} tableName - Name of the table
     * @param {object} options - Query options (filterByFormula, maxRecords, etc.)
     * @returns {Promise<array>} - Array of records
     */
    async getRecords(tableName, options = {}) {
        try {
            const allRecords = [];
            let offset = undefined;

            do {
                const url = new URL(this.getTableUrl(tableName));

                if (options.filterByFormula) url.searchParams.append('filterByFormula', options.filterByFormula);
                if (options.maxRecords)      url.searchParams.append('maxRecords', options.maxRecords);
                if (options.view)            url.searchParams.append('view', options.view);
                if (options.sort) {
                    options.sort.forEach(sort => url.searchParams.append('sort[]', JSON.stringify(sort)));
                }
                if (offset) url.searchParams.append('offset', offset);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: this.getHeaders()
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Failed to get records');
                }

                const data = await response.json();
                allRecords.push(...(data.records || []));
                offset = data.offset; // undefined when no more pages

            } while (offset);

            return allRecords;
        } catch (error) {
            console.error('Error getting records:', error);
            throw error;
        }
    }

    /**
     * Get a single record by ID
     *
     * @param {string} tableName - Name of the table
     * @param {string} recordId - ID of the record
     * @returns {Promise<object>} - Record data
     */
    async getRecord(tableName, recordId) {
        try {
            const url = `${this.getTableUrl(tableName)}/${recordId}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to get record');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting record:', error);
            throw error;
        }
    }

    /**
     * Update an existing record
     *
     * @param {string} tableName - Name of the table
     * @param {string} recordId - ID of the record to update
     * @param {object} fields - Object containing fields to update
     * @returns {Promise<object>} - Updated record data
     */
    async updateRecord(tableName, recordId, fields) {
        try {
            const url = `${this.getTableUrl(tableName)}/${recordId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    fields: fields
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to update record');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating record:', error);
            throw error;
        }
    }

    /**
     * Delete a record
     *
     * @param {string} tableName - Name of the table
     * @param {string} recordId - ID of the record to delete
     * @returns {Promise<object>} - Deletion confirmation
     */
    async deleteRecord(tableName, recordId) {
        try {
            const url = `${this.getTableUrl(tableName)}/${recordId}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to delete record');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting record:', error);
            throw error;
        }
    }

    /**
     * Find a referee by email
     *
     * @param {string} email - Email address to search for
     * @returns {Promise<object|null>} - Referee record or null if not found
     */
    async findRefereeByEmail(email) {
        try {
            const formula = `{Email} = "${email}"`;
            const records = await this.getRecords(this.tables.REFEREES, {
                filterByFormula: formula,
                maxRecords: 1
            });

            return records.length > 0 ? records[0] : null;
        } catch (error) {
            console.error('Error finding referee:', error);
            return null;
        }
    }

    /**
     * Delete multiple records at once (max 10 per call — Airtable limit)
     *
     * @param {string} tableName - Name of the table
     * @param {string[]} recordIds - Array of record IDs to delete
     * @returns {Promise<void>}
     */
    async deleteRecords(tableName, recordIds) {
        // Airtable allows max 10 deletes per request
        const batches = [];
        for (let i = 0; i < recordIds.length; i += 10) {
            batches.push(recordIds.slice(i, i + 10));
        }
        for (const batch of batches) {
            const url = new URL(this.getTableUrl(tableName));
            batch.forEach(id => url.searchParams.append('records[]', id));
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to delete records');
            }
        }
    }

    /**
     * Upsert a referee — create if new, update if existing (matched by email)
     *
     * @param {object} refereeData - Referee fields
     * @returns {Promise<object>} - Created or updated record
     */
    async upsertReferee(refereeData) {
        try {
            const existing = await this.findRefereeByEmail(refereeData['Email']);
            if (existing) {
                return await this.updateRecord(this.tables.REFEREES, existing.id, refereeData);
            } else {
                return await this.createRecord(this.tables.REFEREES, refereeData);
            }
        } catch (error) {
            console.error('Error upserting referee:', error);
            throw error;
        }
    }

    /**
     * Create an availability record
     *
     * @param {object} availabilityData - Availability form data
     * @returns {Promise<object>} - Created availability record
     */
    async createAvailability(availabilityData) {
        return await this.createRecord(this.tables.AVAILABILITY, availabilityData);
    }

    /**
     * Test the connection to Airtable
     *
     * @returns {Promise<boolean>} - True if connection successful
     */
    async testConnection() {
        try {
            await this.getRecords(this.tables.AVAILABILITY, { maxRecords: 1 });
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

// Initialize the client if config is available
let airtableClient = null;

if (typeof CONFIG !== 'undefined') {
    try {
        airtableClient = new AirtableClient(CONFIG);
        console.log('Airtable client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Airtable client:', error);
    }
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.AirtableClient = AirtableClient;
    window.airtableClient = airtableClient;
}
