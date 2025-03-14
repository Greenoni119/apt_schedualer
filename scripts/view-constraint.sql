-- Look at the actual constraint definition to see allowed values
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM 
    pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE 
    rel.relname = 'scheduled'
    AND con.conname = 'scheduled_status_check';

-- Look at what status values exist in current records
SELECT DISTINCT status FROM scheduled;