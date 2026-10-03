using UnityEngine;

namespace Play2Earn
{
    public class GameManager : Singleton<GameManager>
    {
        public GameSO currentGame;

        public void SetCurrentGame(GameSO game)
        {
            currentGame = game;
        }
    }
}