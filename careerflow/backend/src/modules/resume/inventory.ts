export interface Resume {
    id: string; // 'atlas', 'orion', 'nova', 'vega', 'lyra'
    name: string; // Placeholder Label
    type: 'Engineering' | 'Finance' | 'Admin' | 'Data' | 'General';
    keywords: string[];
    content: string; // Simplification for now, would be structured data
}

export const RESUME_INVENTORY: Resume[] = [
    {
        id: 'atlas',
        name: 'Atlas',
        type: 'Engineering',
        keywords: ['javascript', 'typescript', 'react', 'node', 'python', 'aws', 'docker'],
        content: "Experienced Software Engineer with a focus on full-stack development..."
    },
    {
        id: 'orion',
        name: 'Orion',
        type: 'Finance',
        keywords: ['accounting', 'finance', 'excel', 'forecasting', 'reporting'],
        content: "Financial Analyst with 5 years experience in accuracy and reporting..."
    },
    {
        id: 'nova',
        name: 'Nova',
        type: 'Admin',
        keywords: ['operations', 'scheduling', 'management', 'coordination'],
        content: "Operations Manager dedicated to efficiency and team success..."
    },
    {
        id: 'vega',
        name: 'Vega',
        type: 'Data',
        keywords: ['sql', 'python', 'pandas', 'tableau', 'analytics'],
        content: "Data Scientist passionate about uncovering insights from large datasets..."
    },
    {
        id: 'lyra',
        name: 'Lyra',
        type: 'General',
        keywords: ['communication', 'project management', 'writing', 'marketing'],
        content: "Versatile professional with strong communication and project skills..."
    }
];
