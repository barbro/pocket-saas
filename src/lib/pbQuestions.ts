import { pb } from "./pocketbase";

export const getAnswer = async (questionId: string) =>
    await pb.collection('answers')
        .getFirstListItem(`question="${questionId}"`);

export const createAnswer = async (questionId: string, answer: string) =>
    await pb.collection('answers').create({
        "by": pb.authStore.model?.id,
        "question": questionId,
        "answer": answer
    });

export const updateAnswer = async (answerId: string, answer: string) =>
    await pb.collection('answers').update(answerId, {
        "answer": answer
    });