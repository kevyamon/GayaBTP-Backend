import { Types, FilterQuery } from 'mongoose';
import { Faq, IFaq, FaqCategory } from '../models/faq.model';
import { AppError } from '../utils/appError';

class FaqService {
  async getPublishedFaqs(category?: FaqCategory, search?: string): Promise<IFaq[]> {
    const query: FilterQuery<IFaq> = { status: 'published' };

    if (category) {
      query.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ question: searchRegex }, { answer: searchRegex }];
    }

    return Faq.find(query).sort({ category: 1, order: 1 }).lean() as unknown as IFaq[];
  }

  async getAllFaqsAdmin(): Promise<IFaq[]> {
    return Faq.find().sort({ category: 1, order: 1 }).lean() as unknown as IFaq[];
  }

  async createFaq(input: Partial<IFaq>): Promise<IFaq> {
    if (!input.question || !input.answer) {
      throw AppError.badRequest('La question et la reponse sont obligatoires.');
    }

    return Faq.create({
      ...input,
      status: input.status || 'published',
    });
  }

  async updateFaq(id: string, input: Partial<IFaq>): Promise<IFaq> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant de FAQ invalide.');
    }

    const faq = await Faq.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!faq) {
      throw AppError.notFound('Question/Reponse introuvable.');
    }

    return faq;
  }

  async deleteFaq(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant de FAQ invalide.');
    }

    const deleted = await Faq.findByIdAndDelete(id);
    if (!deleted) {
      throw AppError.notFound('Question/Reponse introuvable.');
    }
  }
}

export const faqService = new FaqService();
