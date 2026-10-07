using System;
using UnityEngine;

namespace Play2Earn
{
    public class GameManager : Singleton<GameManager>
    {
        [SerializeField] public GameUIManager gameUIManager;
        public GameSO currentGame;
        public QuestionSO currentQuestion;
        public int currentQuestionIndex = 0;

        public void Start()
        {
            GameEventManager.Instance.OnGameSelected += SetCurrentGame;
            GameEventManager.Instance.OnQuestionSelected += OnQuestionSelected;
            GameEventManager.Instance.OnOptionSelected += OnOptionSelected;
        }

        private void OnQuestionSelected(QuestionSO sO)
        {
            currentQuestion = sO;
        }

        private void OnOptionSelected(string obj)
        {

            string correctAnswer = currentQuestion.Options[currentQuestion.CorrectOptionIndex];
            bool isCorrect = false;

            if (currentQuestion != null)
            {

                if (obj.Equals(correctAnswer, StringComparison.OrdinalIgnoreCase))
                {
                    Debug.Log("Correct answer selected!");
                    isCorrect = true;
                }
                else
                {
                    Debug.Log("Incorrect answer selected.");
                    isCorrect = false;
                }
            }

            GameEventManager.Instance.OnQuestionAnswered?.Invoke(obj, correctAnswer, isCorrect);
            currentQuestionIndex++;
        }

        public void SetCurrentGame(GameSO game)
        {
            currentGame = game;
            currentQuestionIndex = 0; // Reset question index when a new game is selected
            Debug.Log($"Current game set to: {currentGame.Name}");
            gameUIManager.ShowInGameUI();
        }
    }
}