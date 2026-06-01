type SqlErrorInterpretation = {
  diagnosis: string
  suggestion: string
}

export const interpretSqlError = (error: string): SqlErrorInterpretation => {
  const normalized = error.toLowerCase()
  const missingFrom = error.match(/missing from-clause entry for table \"([^\"]+)\"/i)
  if (missingFrom?.[1]) {
    const table = missingFrom[1]
    return {
      diagnosis: `The query references "${table}" but it is not available in that scope.`,
      suggestion:
        `If you used a CTE (WITH ... AS), reference the CTE alias in the outer query instead of "${table}". ` +
        `Use "sets.column_name" instead of "${table}.column_name". ` +
        `Only reference "${table}" inside the CTE binding where it appears in FROM.`,
    }
  }
  if (normalized.includes('unsupported syntax')) {
    return {
      diagnosis: error,
      suggestion: 'Rewrite the query using the supported subset (no FILTER or window frames).',
    }
  }
  if (normalized.includes('unexpected word token')) {
    return {
      diagnosis: error,
      suggestion: 'Rewrite the query without window frame clauses or unsupported keywords.',
    }
  }
  const missingColumn = error.match(/column \"([^\"]+)\" does not exist/i)
  if (missingColumn?.[1]) {
    const col = missingColumn[1]
    if (col === 'session_date' || col === 'performed_at') {
      return {
        diagnosis: `"${col}" is a CTE alias, not a real column in gym_lifts.`,
        suggestion: `Define the sets CTE first: WITH sets AS (SELECT exercise, weight, reps, COALESCE(date::date, timestamp::date) AS session_date, COALESCE(timestamp::timestamptz, date::timestamptz) AS performed_at FROM gym_lifts), then reference sets.${col} in the outer query. Never reference ${col} directly on gym_lifts.`,
      }
    }
    return {
      diagnosis: `The query references a column that does not exist: "${col}".`,
      suggestion: 'Check the schema and update the column name or qualify it with the correct table alias.',
    }
  }
  const missingRelation = error.match(/relation \"([^\"]+)\" does not exist/i)
  if (missingRelation?.[1]) {
    return {
      diagnosis: `The query references a table that does not exist: "${missingRelation[1]}".`,
      suggestion: 'Check the schema and update the table name or schema qualifier.',
    }
  }
  const ambiguousColumn = error.match(/column reference \"([^\"]+)\" is ambiguous/i)
  if (ambiguousColumn?.[1]) {
    return {
      diagnosis: `The column "${ambiguousColumn[1]}" is ambiguous because multiple tables expose it.`,
      suggestion: 'Qualify the column with its table alias (e.g., t.column_name).',
    }
  }
  const syntaxError = error.match(/syntax error at or near \"([^\"]+)\"/i)
  if (syntaxError?.[1]) {
    return {
      diagnosis: `The SQL has a syntax error near "${syntaxError[1]}".`,
      suggestion: 'Check the SELECT syntax, commas, and parentheses around that token.',
    }
  }
  if (normalized.includes('timeout')) {
    return {
      diagnosis: 'The query exceeded the statement timeout.',
      suggestion: 'Add a tighter filter or reduce the time window to narrow the dataset.',
    }
  }
  return {
    diagnosis: 'The query failed to execute due to a SQL error.',
    suggestion: 'Review the SQL and ensure all referenced tables and columns are valid.',
  }
}
