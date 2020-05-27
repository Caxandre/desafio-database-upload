import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Invalid type transaction');
    }

    const categoriesRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    const categoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (categoryExists) {
      const transaction = transactionRepository.create({
        title,
        value,
        type,
        category_id: categoryExists.id,
      });

      await transactionRepository.save(transaction);

      return transaction;
    }

    const createCategory = categoriesRepository.create({
      title: category,
    });

    await categoriesRepository.save(createCategory);

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: createCategory.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
