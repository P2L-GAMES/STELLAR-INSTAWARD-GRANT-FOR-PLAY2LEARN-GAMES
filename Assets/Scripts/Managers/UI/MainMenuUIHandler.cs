using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Play2Earn
{
    public class MainMenuUIHandler : MonoBehaviour
    {
        [Header("Center Panel")]
        [SerializeField] private Transform centerPanel;
        [SerializeField] private TMP_Text centerPanelTitleText;

        [Header("SelectGame Button Panel")]
        [SerializeField] private Transform selectGameButtonPanel;

        [Header("Start Game Button")]
        [SerializeField] private Button startGameButton;

        private GameSO selectedGame;



        void Start()
        {
            ResetUI();
            RegisterListeners();
            PopulateSelectGameButtons();
        }

        public void PopulateSelectGameButtons()
        {
            List<GameSO> gameSOs = QuestionManager.Instance.games;

            int index = 0;

            foreach (Transform buttonTransform in selectGameButtonPanel)
            {
                if (index < gameSOs.Count)
                {
                    GameSO game = gameSOs[index];

                    Button button = buttonTransform.GetComponent<Button>();
                    button.onClick.RemoveAllListeners();
                    button.onClick.AddListener(() => OnSelectGameButtonClicked(game.GameType));
                    buttonTransform.GetComponentInChildren<TMP_Text>().text = game.Name;
                    buttonTransform.gameObject.SetActive(true);
                }
                index++;
            }

            selectGameButtonPanel.GetChild(0).GetComponent<Button>().onClick.Invoke();
        }

        private void OnSelectGameButtonClicked(GameType gameType)
        {
            GameSO game = QuestionManager.Instance.GetGameByType(gameType);
            if (game != null)
            {
                selectedGame = game;
                UpdateCenterPanelImage(selectedGame);
                startGameButton.interactable = true;
            }
        }

        private void UpdateCenterPanelImage(GameSO game)
        {
            centerPanelTitleText.text = game.Description;

            foreach (Transform child in centerPanel)
            {
                Image image = child.GetComponent<Image>();
                if (image != null)
                {
                    image.sprite = game.Icon;
                }
            }
        }

        private void HandleStartGameButtonClicked()
        {
            if (selectedGame != null)
                GameEventManager.Instance.OnGameSelected?.Invoke(selectedGame);
        }

        private void RegisterListeners()
        {
            startGameButton.onClick.RemoveAllListeners();
            startGameButton.onClick.AddListener(HandleStartGameButtonClicked);
        }

        private void ResetUI()
        {
            centerPanelTitleText.text = "Select a Game";
            foreach (Transform child in centerPanel)
            {
                Image image = child.GetComponent<Image>();
                if (image != null)
                {
                    image.sprite = null;
                }
            }

            foreach (Transform buttonTransform in selectGameButtonPanel)
            {
                buttonTransform.gameObject.SetActive(false);
            }

            startGameButton.interactable = false;
        }
    }

}

