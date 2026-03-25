/**
 * Supabase Client — drop-in replacement for AirtableClient
 *
 * Mirrors AirtableClient method signatures exactly so form-handler.js
 * requires minimal changes. Returns data wrapped in {id, fields} shape
 * to match Airtable response format.
 */

class SupabaseClientWrapper {
    constructor(config) {
        if (!config || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration is missing. Check config.js for SUPABASE_URL and SUPABASE_ANON_KEY.');
        }
        this.client = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        this.tables = config.AIRTABLE_TABLES; // same table name map, lowercase keys
    }

    // Map Airtable table name strings to Supabase table names (lowercase)
    _tableName(name) {
        const map = {
            'Referees':    'referees',
            'Clubs':       'clubs',
            'Fields':      'fields',
            'Games':       'games',
            'Availability':'availability',
            'Venues':      'venues',
            'Settings':    'settings',
            'Assignors':   'assignors'
        };
        return map[name] || name.toLowerCase();
    }

    // Map Airtable field names → Supabase column names where they differ
    _normalizeFields(fields) {
        const map = {
            'Name':    'name',
            'Email':   'email',
            'Phone':   'phone',
            'Address': 'address',
            'City':    'city',
            'State':   'state',
            'Notes':   'notes',
            'Status':  'status',
            'Gender':  'gender',
            'Games':   'games',
            'Age':     'age',
            'Rating':  'rating',
            'League':  'league'
        };
        const out = {};
        for (const [k, v] of Object.entries(fields)) {
            out[map[k] || k] = v;
        }
        return out;
    }

    // Wrap a Supabase row into Airtable-shaped record: { id, fields: {...} }
    _wrap(row) {
        if (!row) return null;
        const { id, ...fields } = row;
        return { id, fields };
    }

    _wrapAll(rows) {
        return (rows || []).map(r => this._wrap(r));
    }

    /**
     * Get records from a table
     * Supports: filterByFormula (basic =email match), maxRecords
     */
    async getRecords(tableName, options = {}) {
        try {
            const tbl = this._tableName(tableName);
            let query = this.client.from(tbl).select('*');

            // Basic filter support: {Field} = "value" → .eq()
            // OR({Email} = "x", {Email 2} = "x") → .or()
            if (options.filterByFormula) {
                const formula = options.filterByFormula;

                // Handle OR({Email} = "x", {Email 2} = "x")
                const orMatch = formula.match(/^OR\(\{(.+?)\}\s*=\s*"(.+?)",\s*\{(.+?)\}\s*=\s*"(.+?)"\)$/i);
                if (orMatch) {
                    const col1 = orMatch[1];
                    const val1 = orMatch[2];
                    const col2 = orMatch[3];
                    const val2 = orMatch[4];
                    query = query.or(`${col1}.eq.${val1},${col2}.eq.${val2}`);
                }

                // Handle {Field} = "value"
                const eqMatch = formula.match(/^\{(.+?)\}\s*=\s*"(.+?)"$/);
                if (eqMatch) {
                    query = query.eq(eqMatch[1], eqMatch[2]);
                }
            }

            if (options.maxRecords) {
                query = query.limit(options.maxRecords);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return this._wrapAll(data);
        } catch (error) {
            console.error('SupabaseClient getRecords error:', error);
            throw error;
        }
    }

    /**
     * Get a single record by ID
     */
    async getRecord(tableName, recordId) {
        try {
            const tbl = this._tableName(tableName);
            const { data, error } = await this.client
                .from(tbl)
                .select('*')
                .eq('id', recordId)
                .single();
            if (error) throw new Error(error.message);
            return this._wrap(data);
        } catch (error) {
            console.error('SupabaseClient getRecord error:', error);
            throw error;
        }
    }

    /**
     * Create a new record
     */
    async createRecord(tableName, fields) {
        try {
            const tbl = this._tableName(tableName);
            const { data, error } = await this.client
                .from(tbl)
                .insert(this._normalizeFields(fields))
                .select()
                .single();
            if (error) throw new Error(error.message);
            return this._wrap(data);
        } catch (error) {
            console.error('SupabaseClient createRecord error:', error);
            throw error;
        }
    }

    /**
     * Update a record by ID
     */
    async updateRecord(tableName, recordId, fields) {
        try {
            const tbl = this._tableName(tableName);
            const { data, error } = await this.client
                .from(tbl)
                .update(this._normalizeFields(fields))
                .eq('id', recordId)
                .select()
                .single();
            if (error) throw new Error(error.message);
            return this._wrap(data);
        } catch (error) {
            console.error('SupabaseClient updateRecord error:', error);
            throw error;
        }
    }

    /**
     * Delete a record by ID
     */
    async deleteRecord(tableName, recordId) {
        try {
            const tbl = this._tableName(tableName);
            const { error } = await this.client
                .from(tbl)
                .delete()
                .eq('id', recordId);
            if (error) throw new Error(error.message);
            return { deleted: true, id: recordId };
        } catch (error) {
            console.error('SupabaseClient deleteRecord error:', error);
            throw error;
        }
    }

    /**
     * Delete multiple records by ID
     */
    async deleteRecords(tableName, recordIds) {
        try {
            const tbl = this._tableName(tableName);
            const { error } = await this.client
                .from(tbl)
                .delete()
                .in('id', recordIds);
            if (error) throw new Error(error.message);
        } catch (error) {
            console.error('SupabaseClient deleteRecords error:', error);
            throw error;
        }
    }

    /**
     * Find a referee by email (checks Email and Email 2 columns)
     */
    async findRefereeByEmail(email) {
        try {
            const { data, error } = await this.client
                .from('referees')
                .select('*')
                .or(`Email.eq.${email},"Email 2".eq.${email}`)
                .limit(1);
            if (error) throw new Error(error.message);
            return data && data.length > 0 ? this._wrap(data[0]) : null;
        } catch (error) {
            console.error('SupabaseClient findRefereeByEmail error:', error);
            return null;
        }
    }

    /**
     * Upsert a referee — create if new, update if existing
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
            console.error('SupabaseClient upsertReferee error:', error);
            throw error;
        }
    }

    /**
     * Create an availability record
     */
    async createAvailability(availabilityData) {
        return await this.createRecord(this.tables.AVAILABILITY, availabilityData);
    }

    /**
     * Test the connection
     */
    async testConnection() {
        try {
            const { error } = await this.client
                .from('availability')
                .select('id')
                .limit(1);
            return !error;
        } catch {
            return false;
        }
    }
}

// Initialize and expose globally
let supabaseClient = null;

if (typeof CONFIG !== 'undefined') {
    try {
        supabaseClient = new SupabaseClientWrapper(CONFIG);
        console.log('Supabase client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
    }
}

if (typeof window !== 'undefined') {
    window.SupabaseClientWrapper = SupabaseClientWrapper;
    window.supabaseClient = supabaseClient;
}
