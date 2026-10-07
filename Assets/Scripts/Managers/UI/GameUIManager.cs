using UnityEngine;

namespace Play2Earn
{
    public class GameUIManager : MonoBehaviour
    {
        [SerializeField] public MainMenuUIHandler mainMenuPanel;
        [SerializeField] public InGameUIHandler inGamePanel;

        public void Start()
        {
            ShowMainMenu();
        }

        public void ShowMainMenu()
        {
            mainMenuPanel.gameObject.SetActive(true);
            inGamePanel.gameObject.SetActive(false);
        }

        public void ShowInGameUI()
        {
            mainMenuPanel.gameObject.SetActive(false);
            inGamePanel.gameObject.SetActive(true);

            inGamePanel.PopulateQuestionPanel(QuestionManager.Instance.GetQuestionsForGame(GameManager.Instance.currentGame));
        }


    }

}
