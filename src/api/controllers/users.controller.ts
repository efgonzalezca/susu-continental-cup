import { NextFunction, Request, Response } from 'express';

import { ICustomRequest } from '../../types';
import { getExtraParams, logger, ErrorHandler } from '../../utils';
import { UserService, UserMatchesService, MatchService, matchData } from '../../services';

interface register {
  document: string,
  names: string,
  surnames: string,
  password: string,
  cellphone: string
}

interface updated {
  password?: string,
  champion?: string,
  runner_up?: string,
  third_place?: string
}

interface resetPassword {
  document: string,
  newPassword: string
}

export const getMatchesUsersById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const userMatchesById = await UserMatchesService.getUsersMatchesByIdMatch(id)?.lean();
    const users = await UserService.findAll()?.lean();
  
    const allData = userMatchesById?.map((match) => {
      let obj = {};
       let user = users?.find((user) => user._id === match.user_id);
      obj = {
        ...match,user: {
          names : user?.names,
          surnames : user?.surnames,
        }
      }
      return obj;
    })
  
    return res
      .status(200)
      .json(allData)
  } catch (error) {
    return next(error);
  }
}

export const modifyMatchFromUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id, userId } = req.params
  const { local_score, visitor_score } = req.body
  try {
    let user = await UserService.findById(userId)?.lean();
    let match = await MatchService.findById(id)?.lean();
    if(!user || !match) {
      throw new ErrorHandler(404, 40401, 'User or match not found');
    }
    let today = new Date()
    if(today.getTime() > (match.date).getTime()) {
      throw new ErrorHandler(423, 42301, 'Match cannot be modified');
    }
    const userMatchUpdated = await UserMatchesService.findByUserAndIdAndUpdate(userId, id, {local_score, visitor_score})?.lean();
    logger.info(`Modify match ${id} from user ${userId}`, getExtraParams(req));
    return res
      .status(200)
      .json({
        message: 'User match updated',
        match_id: userMatchUpdated?.match_id
      })
  } catch(err) {
    return next(err);
  }
}

export const getUsersRanking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let users = await UserService.findAll({score: true, podium_score: true, names: true, surnames: true})?.lean();
    logger.info('Read usermatches', getExtraParams(req));
    if(!users) {
      throw new Error('No records to users');
    }
    const usersRanking = users.map((user) => {
      const userToRanking = {
        ...user,
        score: user.score + user.podium_score
      }
      return userToRanking;
    })
    return res
      .status(200)
      .json(usersRanking)
  } catch(err) {
    return next(err);
  }
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      document,
      names,
      surnames,
      password,
      cellphone
    } = <register>req.body;

    const registrationDeadline = new Date('2024-06-20T17:00:00.000Z'); 
    
    if(new Date() > registrationDeadline) {
      throw new ErrorHandler(423, 42302, 'Registration deadline reached');
    }
    
    const user = await UserService.exists(document);
    
    if(user) {
      throw new ErrorHandler(400, 40003, 'User exists');
    }

    let newUser = {
      _id: document,
      names: names,
      surnames: surnames,
      password: password,
      cellphone: cellphone,
      score: 0,
      selected_teams: {
        champion: null,
        runner_up: null,
        third_place: null
      }
    }

    await UserService.create(newUser)

    const matches = await MatchService.findAll()?.lean();
    
    const userMatches = matches?.map((match) => {
      return {
        user_id: document,
        match_id: match._id,
        local_score: null,
        visitor_score: null
      }
    })

    await UserMatchesService.createAll(<matchData[]>userMatches);

    logger.info(`Created user ${document}`, getExtraParams(req));
    return res
      .status(201)
      .json({
        message: 'User created',
        id: document
      })
  } catch(err) {
    return next(err);
  }
}

export const updateUser = async (req: ICustomRequest, res: Response, next: NextFunction) => {
  try {
    const firstMatch = await MatchService.findById('1')?.lean();
    if(!firstMatch || new Date().getTime() > firstMatch.date.getTime()) {
      throw new ErrorHandler(423, 42301, 'Date deadline exceeded');
    }
    const { password, champion, runner_up, third_place } = <updated>req.body;
    if(password) {
      await UserService.updateById(<string>req.payload?.document, password, 'password');
    } else if(champion) {
      await UserService.updateById(<string>req.payload?.document, champion, 'champion');
    } else if(runner_up) {
      await UserService.updateById(<string>req.payload?.document, runner_up, 'runner_up');
    } else if(third_place) {
      await UserService.updateById(<string>req.payload?.document, third_place, 'third_place');
    } else {
      throw new ErrorHandler(500, 50002, 'Invalid user updated');
    }
    return res
      .status(200)
      .json({
        message: 'User updated'
      })
  } catch(err) {
    return next(err);
  }
}

export const resetUserPassword = async (req: ICustomRequest, res: Response, next: NextFunction) => {
  try {
    const { document, newPassword } = <resetPassword>req.body;
    await UserService.updateById(document, newPassword, 'password');
    return res
      .status(200)
      .json({
        message: 'User password reseted'
      })
  } catch(err) {
    return next(err);
  }
}