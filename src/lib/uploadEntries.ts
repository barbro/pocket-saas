// Type definitions
type Question = {
    number: number;
    text: string;
};

type StepEntry =
    | {
        type: string;
        step_number: number;
        raw_text: string;
        notes: string[];
        questions: Question[];
    }
    | {
        type: string;
        step_number: number;
        raw_text: string;
        questions: Question[];
        notes?: undefined;
    }
    | {
        type: string;
        step_number: number;
        raw_text: string;
        notes: string[];
        questions?: undefined;
    };

type StepsGuide = StepEntry[];

// Content type for the database record
type EntryContent = {
    notes?: string[];
    questions?: Question[];
};

// Database record structure
type BookEntry = {
    step_number: number;
    entry_number: number;
    needs_answer: boolean;
    content: EntryContent;
};

// Function to delete all existing records
export async function deleteAllBookEntries(pb: any): Promise<void> {
    try {
        console.log('Fetching all existing records...');

        // Fetch all records (you might need to paginate if you have many records)
        const existingRecords = await pb.collection('book_entries').getFullList();

        console.log(`Found ${existingRecords.length} existing records to delete`);

        if (existingRecords.length === 0) {
            console.log('No existing records to delete');
            return;
        }

        // Delete records one by one (PocketBase doesn't have bulk delete)
        for (let i = 0; i < existingRecords.length; i++) {
            const record = existingRecords[i];
            try {
                await pb.collection('book_entries').delete(record.id);
                console.log(`Deleted record ${i + 1}/${existingRecords.length} (ID: ${record.id})`);
            } catch (error) {
                console.error(`Failed to delete record ${record.id}:`, error);
                throw error;
            }
        }

        console.log('All existing records deleted successfully');
    } catch (error) {
        console.error('Failed to delete existing records:', error);
        throw error;
    }
}

// Sequential creation function (original, without delete)
export async function createStepEntriesSequential(
    pb: any,
    stepData: StepsGuide
): Promise<any[]> {
    const results = [];

    // Track entry numbers per step
    const stepEntryCounts: { [stepNumber: number]: number } = {};

    for (let index = 0; index < stepData.length; index++) {
        const entry = stepData[index];

        // Initialize or increment entry number for this step
        if (!stepEntryCounts[entry.step_number]) {
            stepEntryCounts[entry.step_number] = 0;
        }
        stepEntryCounts[entry.step_number]++;

        // Determine if entry needs answer (has questions)
        const needsAnswer = Boolean(entry.questions && entry.questions.length > 0);

        // Prepare content JSON with proper typing
        const content: EntryContent = {};
        if (entry.notes) {
            content.notes = entry.notes;
        }
        if (entry.questions) {
            content.questions = entry.questions;
        }

        try {
            const result = await pb.collection('book_entries').create({
                step_number: entry.step_number,
                entry_number: stepEntryCounts[entry.step_number], // Reset per step
                needs_answer: needsAnswer,
                content: content,
            } as BookEntry);

            results.push(result);
            console.log(`Created entry ${stepEntryCounts[entry.step_number]} for step ${entry.step_number} (${index + 1}/${stepData.length} total)`);
        } catch (error) {
            console.error(`Failed to create entry ${stepEntryCounts[entry.step_number]} for step ${entry.step_number}:`, error);
            throw error;
        }
    }

    console.log('All entries created successfully:', results);
    return results;
}

// Sequential creation with delete functionality
export async function createStepEntriesSequentialWithReset(
    pb: any,
    stepData: StepsGuide,
    deleteExisting: boolean = true
): Promise<any[]> {
    // Delete existing records first if requested
    if (deleteExisting) {
        await deleteAllBookEntries(pb);
    }

    const results = [];

    // Track entry numbers per step
    const stepEntryCounts: { [stepNumber: number]: number } = {};

    console.log(`Creating ${stepData.length} new entries...`);

    for (let index = 0; index < stepData.length; index++) {
        const entry = stepData[index];

        // Initialize or increment entry number for this step
        if (!stepEntryCounts[entry.step_number]) {
            stepEntryCounts[entry.step_number] = 0;
        }
        stepEntryCounts[entry.step_number]++;

        // Determine if entry needs answer (has questions)
        const needsAnswer = Boolean(entry.questions && entry.questions.length > 0);

        // Prepare content JSON with proper typing
        const content: EntryContent = {};
        if (entry.notes) {
            content.notes = entry.notes;
        }
        if (entry.questions) {
            content.questions = entry.questions;
        }

        try {
            const result = await pb.collection('book_entries').create({
                step_number: entry.step_number,
                entry_number: stepEntryCounts[entry.step_number], // Reset per step
                needs_answer: needsAnswer,
                content: content,
            } as BookEntry);

            results.push(result);
            console.log(`Created entry ${stepEntryCounts[entry.step_number]} for step ${entry.step_number} (${index + 1}/${stepData.length} total)`);
        } catch (error) {
            console.error(`Failed to create entry ${stepEntryCounts[entry.step_number]} for step ${entry.step_number}:`, error);
            throw error;
        }
    }

    console.log('All entries created successfully:', results);
    return results;
}

// Utility function to chunk array
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// Parallel creation with controlled concurrency and delete functionality
export async function createStepEntriesParallelWithReset(
    pb: any,
    stepData: StepsGuide,
    concurrency: number = 10,
    deleteExisting: boolean = true
): Promise<any[]> {
    // Delete existing records first if requested
    if (deleteExisting) {
        await deleteAllBookEntries(pb);
    }

    // Track entry numbers per step
    const stepEntryCounts: { [stepNumber: number]: number } = {};

    console.log(`Creating ${stepData.length} new entries...`);

    // Prepare all entries first
    const entriesToCreate = stepData.map((entry: StepEntry, index: number) => {
        // Initialize or increment entry number for this step
        if (!stepEntryCounts[entry.step_number]) {
            stepEntryCounts[entry.step_number] = 0;
        }
        stepEntryCounts[entry.step_number]++;

        const needsAnswer = Boolean(entry.questions && entry.questions.length > 0);

        const content: EntryContent = {};
        if (entry.notes) {
            content.notes = entry.notes;
        }
        if (entry.questions) {
            content.questions = entry.questions;
        }

        return {
            step_number: entry.step_number,
            entry_number: stepEntryCounts[entry.step_number], // Reset per step
            needs_answer: needsAnswer,
            content: content,
        } as BookEntry;
    });

    // Process in chunks to control concurrency
    const chunks = chunkArray(entriesToCreate, concurrency);
    const results = [];

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];

        console.log(`Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} entries)`);

        try {
            // Process chunk in parallel
            const chunkResults = await Promise.all(
                chunk.map(entry => pb.collection('book_entries').create(entry))
            );

            results.push(...chunkResults);
            console.log(`Chunk ${chunkIndex + 1} completed successfully`);
        } catch (error) {
            console.error(`Chunk ${chunkIndex + 1} failed:`, error);
            throw error;
        }
    }

    console.log('All entries created successfully:', results.length);
    return results;
}