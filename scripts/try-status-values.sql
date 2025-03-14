-- Create a function to try different status values
DO $$ 
DECLARE
    status_values TEXT[] := ARRAY['scheduled', 'pending', 'active', 'complete', 'completed', 'canceled', 'cancelled', 'new', 'processing', 'queued', 'waiting', 'done', 'incomplete', 'no-show', 'rescheduled', 'late', 'accepted', 'declined', 'open', 'closed'];
    test_value TEXT;
    apt_num TEXT;
    success BOOLEAN;
BEGIN
    -- Try each status value
    FOR i IN 1..array_length(status_values, 1) LOOP
        test_value := status_values[i];
        apt_num := 9000 + i;
        success := FALSE;
        
        BEGIN
            -- Try to insert with this status value
            INSERT INTO scheduled (
                apt_number,
                first_name,
                last_name,
                email,
                appointment_date,
                appointment_time,
                text_notification,
                status
            ) VALUES (
                apt_num::TEXT,
                'Status',
                'Test',
                'test@example.com',
                CURRENT_DATE,
                '10:00:00',
                0,
                test_value
            );
            
            success := TRUE;
            
            -- If we get here, insertion succeeded
            RAISE NOTICE 'Status value % works!', test_value;
            
            -- Clean up the test row
            DELETE FROM scheduled WHERE apt_number = apt_num::TEXT;
            
        EXCEPTION WHEN OTHERS THEN
            -- If we get here, insertion failed
            RAISE NOTICE 'Status value % fails with error: %', test_value, SQLERRM;
        END;
    END LOOP;
END $$;