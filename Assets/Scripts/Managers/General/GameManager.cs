using UnityEngine;

namespace Play2Earn
{
    public class GameManager : Singleton<GameManager>
    {
        [SerializeField] public GameUIManager gameUIManager;
        public GameSO currentGame;

        public void Start()
        {
            GameEventManager.Instance.OnGameSelected += SetCurrentGame;
        }

        public void SetCurrentGame(GameSO game)
        {
            currentGame = game;
            Debug.Log($"Current game set to: {currentGame.Name}");
            gameUIManager.ShowInGameUI();
        }
    }
}