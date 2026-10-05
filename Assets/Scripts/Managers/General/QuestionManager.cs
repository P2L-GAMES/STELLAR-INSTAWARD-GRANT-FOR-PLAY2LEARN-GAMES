using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace Play2Earn
{
    public class QuestionManager : Singleton<QuestionManager>
    {
        public List<GameSO> games;

        public GameSO GetGameByType(GameType gameType)
        {
            foreach (var game in games)
            {
                if (game.GameType == gameType)
                {
                    return game;
                }
            }
            return null;
        }

        public List<QuestionSO> GetQuestionsForGame(GameSO game)
        {
            return game.Questions.ToList();
        }
    }

}

