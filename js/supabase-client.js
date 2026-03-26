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

    // Map a single Airtable column name → Supabase column name
    _col(name) {
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
            'League':  'league',
            // Availability fields — only single-word cols went lowercase on import
            'Date':   'date',
            'Time':   'time',
            'Value':  'value',
            'Style':  'style',
            'Role':   'role',
            'Zip':    'zip',
            'Key':    'key',
            'Active': 'active',
            'Clubs':  'clubs',
        };
        return map[name] || name;
    }

    // Reverse map: Supabase lowercase col → Airtable field name
    // Only needed for cols that were lowercased on import (single-word cols)
    _colReverse(name) {
        const map = {
            'name':    'Name',
            'email':   'Email',
            'phone':   'Phone',
            'address': 'Address',
            'city':    'City',
            'state':   'State',
            'notes':   'Notes',
            'status':  'Status',
            'gender':  'Gender',
            'games':   'Games',
            'age':     'Age',
            'rating':  'Rating',
            'league':  'League',
            'date':      'Date',
            'president': 'President',
            'time':      'Time',
            'value':     'Value',
            'style':     'Style',
            'role':      'Role',
            'field':     'Field',
            'venue':     'Venue',
            'zip':       'Zip',
            'zip_code':  'Zip Code',
            'club':      'Club',
            'clubs':     'Clubs',
            'active':    'Active',
            'key':       'Key',
        };
        return map[name] || name;
    }

    // Normalize all keys in a fields object (Airtable → Supabase, for writes)
    _normalizeFields(fields) {
        const out = {};
        for (const [k, v] of Object.entries(fields)) {
            out[this._col(k)] = v;
        }
        return out;
    }

    // Re-key fields from Supabase col names → Airtable field names (for reads)
    _denormalizeFields(fields) {
        const out = {};
        for (const [k, v] of Object.entries(fields)) {
            out[this._colReverse(k)] = v;
        }
        return out;
    }

    // Wrap a Supabase row into Airtable-shaped record: { id, fields: {...} }
    _wrap(row) {
        if (!row) return null;
        const { id, created_at, club_id, ...fields } = row;
        return { id, fields: this._denormalizeFields(fields) };
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
                    const col1 = this._col(orMatch[1]);
                    const val1 = orMatch[2];
                    const col2 = this._col(orMatch[3]);
                    const val2 = orMatch[4];
                    query = query.or(`${col1}.eq.${val1},${col2}.eq.${val2}`);
                }

                // Handle {Field} = "value"
                const eqMatch = formula.match(/^\{(.+?)\}\s*=\s*"(.+?)"$/);
                if (eqMatch) {
                    query = query.eq(this._col(eqMatch[1]), eqMatch[2]);
                }

                // RECORD_ID()='value' → .eq('id', value)
                const recIdMatch = formula.match(/^RECORD_ID\(\)\s*=\s*'(.+?)'$/i);
                if (recIdMatch) {
                    query = query.eq('id', recIdMatch[1]);
                }

                // AND(LOWER({Key})='value', {Active}=TRUE()) → settings banner lookup
                const settingsActiveMatch = formula.match(/^AND\(LOWER\(\{Key\}\)\s*=\s*'(.+?)',\s*\{Active\}\s*=\s*TRUE\(\)\)$/i);
                if (settingsActiveMatch) {
                    query = query.eq('key', settingsActiveMatch[1]).eq('active', true);
                }

                // LOWER({Key})='value' → simple key match
                const lowerKeyMatch = formula.match(/^LOWER\(\{Key\}\)\s*=\s*'(.+?)'$/i);
                if (lowerKeyMatch) {
                    query = query.eq('key', lowerKeyMatch[1]);
                }

                // AND(NOT(IS_BEFORE({Date},'x')), NOT(IS_AFTER({Date},'y'))) → date range
                const andDateMatch = formula.match(/^AND\(NOT\(IS_BEFORE\(\{Date\},\s*'(.+?)'\)\),\s*NOT\(IS_AFTER\(\{Date\},\s*'(.+?)'\)\)\)$/i);
                if (andDateMatch) {
                    query = query.gte('date', andDateMatch[1]).lte('date', andDateMatch[2]);
                }

                // NOT(IS_BEFORE({Date},'value')) → .gte
                const notBeforeMatch = formula.match(/^NOT\(IS_BEFORE\(\{Date\},\s*'(.+?)'\)\)$/i);
                if (notBeforeMatch) {
                    query = query.gte('date', notBeforeMatch[1]);
                }

                // NOT(IS_AFTER({Date},'value')) → .lte
                const notAfterMatch = formula.match(/^NOT\(IS_AFTER\(\{Date\},\s*'(.+?)'\)\)$/i);
                if (notAfterMatch) {
                    query = query.lte('date', notAfterMatch[1]);
                }

                // IS_AFTER({Date},'value') → .gt
                const isAfterMatch = formula.match(/^IS_AFTER\(\{Date\},\s*'(.+?)'\)$/i);
                if (isAfterMatch) {
                    query = query.gt('date', isAfterMatch[1]);
                }

                // OR(IS_SAME({Date},'x','day'), IS_SAME({Date},'y','day')) → .in()
                const orSameMatch = formula.match(/^OR\(IS_SAME\(\{Date\},'(.+?)','day'\),\s*IS_SAME\(\{Date\},'(.+?)','day'\)\)$/i);
                if (orSameMatch) {
                    query = query.in('date', [orSameMatch[1], orSameMatch[2]]);
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
            // Check primary email first
            const { data: d1, error: e1 } = await this.client
                .from('referees').select('*').eq('email', email).limit(1);
            if (!e1 && d1 && d1.length > 0) return this._wrap(d1[0]);

            // Fall back to Email 2 (column name has a space — can't use .or())
            const { data: d2, error: e2 } = await this.client
                .from('referees').select('*').eq('Email 2', email).limit(1);
            if (!e2 && d2 && d2.length > 0) return this._wrap(d2[0]);

            return null;
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
     * Get upcoming availability records for a referee (today and future)
     */
    async getUpcomingAvailability(refereeName) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await this.client
                .from('availability')
                .select('*')
                .ilike('Referee Name', refereeName)
                .gte('date', today)
                .order('date', { ascending: true })
                .order('Start Time', { ascending: true });
            if (error) throw new Error(error.message);
            return this._wrapAll(data);
        } catch (error) {
            console.error('SupabaseClient getUpcomingAvailability error:', error);
            return [];
        }
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
