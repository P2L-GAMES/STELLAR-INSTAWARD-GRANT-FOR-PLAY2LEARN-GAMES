using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine;
using TMPro;
using System.Linq;
using System;

namespace Play2Earn
{
    public class InGameUIHandler : MonoBehaviour
    {
        [SerializeField] private Transform questionPanel;
        [SerializeField] private Transform optionPanel;
        [SerializeField] private Button backButton;
        [SerializeField] private Button nextButton;

        private QuestionSO currentQuestion;

        public void OnEnable()
        {
            RegisterListeners();
        }

        private void RegisterListeners()
        {
            GameEventManager.Instance.OnQuestionAnswered += HandleQuestionAnswered;
            backButton.onClick.AddListener(OnBackButtonClicked);
            nextButton.onClick.AddListener(LoadNextQuestion);
        }

        private void HandleQuestionAnswered(string selectedAnswer, string correctAnswer, bool isCorrect)
        {
            foreach (Transform child in optionPanel)
            {
                OptionUIItem optionUIItem = child.GetComponent<OptionUIItem>();
                if (optionUIItem.value.Equals(selectedAnswer, StringComparison.OrdinalIgnoreCase))
                {
                    if (isCorrect)
                    {
                        optionUIItem.MarkAsCorrect(true);
                    }
                    else
                    {
                        optionUIItem.MarkAsCorrect(false);
                        HighlightCorrectAnswer();
                    }
                }

                void HighlightCorrectAnswer()
                {
                    foreach (Transform optionChild in optionPanel)
                    {
                        OptionUIItem optionItem = optionChild.GetComponent<OptionUIItem>();
                        if (optionItem.value.Equals(correctAnswer, StringComparison.OrdinalIgnoreCase))
                        {
                            optionItem.MarkAsCorrect(true);
                        }
                    }
                }
            }
        }

        private void OnBackButtonClicked()
        {
            GameManager.Instance.gameUIManager.ShowMainMenu();
        }

        public void PopulateQuestionPanel(List<QuestionSO> questions)
        {
            foreach (Transform child in questionPanel)
                child.gameObject.SetActive(false);

            for (int i = 0; i < questions.Count; i++)
            {
                if (i < questionPanel.childCount)
                {
                    Transform questionItemTransform = questionPanel.GetChild(i);
                    QuestionUIItem questionUIItem = questionItemTransform.GetComponent<QuestionUIItem>();
                    questionUIItem.questionSO = questions[i];
                    questionUIItem.Init();
                    questionItemTransform.gameObject.SetActive(true);
                    questionUIItem.SetClosedState(true);
                }
            }

            ActivateQuestion(GameManager.Instance.currentQuestionIndex);

        }

        public void ActivateQuestion(int questionIndex)
        {
            foreach (Transform child in questionPanel)
            {
                QuestionUIItem questionUIItem = child.GetComponent<QuestionUIItem>();
                questionUIItem.SetClosedState(true);
            }

            if (questionIndex < QuestionManager.Instance.GetQuestionsForGame(GameManager.Instance.currentGame).Count)
            {
                Transform questionItemTransform = questionPanel.GetChild(questionIndex);
                QuestionUIItem questionUIItem = questionItemTransform.GetComponent<QuestionUIItem>();
                questionUIItem.SetClosedState(false);

                GameEventManager.Instance.OnQuestionSelected?.Invoke(questionUIItem.questionSO);
                PopulateOptionPanel(questionUIItem.questionSO.Options.ToList());
            }
        }

        public void PopulateOptionPanel(List<string> options)
        {
            foreach (Transform child in optionPanel)
            {
                OptionUIItem optionUIItem = child.GetComponent<OptionUIItem>();
                optionUIItem.Hide();
            }


            for (int i = 0; i < options.Count; i++)
            {
                if (i < optionPanel.childCount)
                {
                    OptionUIItem optionItemTransform = optionPanel.GetChild(i).GetComponent<OptionUIItem>();
                    optionItemTransform.value = options[i];
                    optionItemTransform.Init();
                }
            }
        }

        public void LoadNextQuestion()
        {
            if (GameManager.Instance.currentQuestionIndex < questionPanel.childCount)
            {
                ActivateQuestion(GameManager.Instance.currentQuestionIndex);
            }
            else
            {
                Debug.Log("All questions answered. Game Over!");
            }
        }

        public void OnDisable()
        {
            backButton.onClick.RemoveAllListeners();
            nextButton.onClick.RemoveAllListeners();
            GameEventManager.Instance.OnQuestionAnswered -= HandleQuestionAnswered;
        }
    }
}