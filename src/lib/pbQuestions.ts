import { pb } from "./pocketbase";

export const getAnswer = async (entryId: string) =>
    await pb.collection('answers')
        .getFirstListItem(`question="${entryId}"`);

export const createAnswer = async (entryId: string, answerText: string) =>
    await pb.collection('answers').create({
        "by": pb.authStore.model?.id,
        "question": entryId,
        "answer_text": answerText
    });

export const updateAnswer = async (answerId: string, answerText: string) =>
    await pb.collection('answers').update(answerId, {
        "answer_text": answerText
    });

// Get the total number of entries in a specific step
export const getStepEntriesCount = async (stepNumber: number) => {
    const entries = await pb.collection('book_entries')
        .getFullList({
            filter: `step_number=${stepNumber}`
        });
    return entries.length;
};

// Get the latest entry for the current user
export const getLatestEntry = async () =>
    await pb.collection('last_entry')
        .getFirstListItem(`user="${pb.authStore.model?.id}"`);

// Update or create the latest entry for the current user
export const updateLatestEntry = async (entryId: string) =>
    await pb.collection('last_entry').update(pb.authStore.model?.id, {
        "entry": entryId
    });

// Create the latest entry record for the current user
export const createLatestEntry = async (entryId: string) =>
    await pb.collection('last_entry').create({
        "user": pb.authStore.model?.id,
        "entry": entryId
    });