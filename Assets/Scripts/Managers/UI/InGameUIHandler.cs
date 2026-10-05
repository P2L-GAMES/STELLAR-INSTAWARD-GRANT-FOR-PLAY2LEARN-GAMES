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

        private QuestionSO currentQuestion;

        public void OnEnable()
        {
            RegisterListeners();
        }

        private void RegisterListeners()
        {
            backButton.onClick.AddListener(OnBackButtonClicked);
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

            ActivateQuestion(0);

        }

        public void ActivateQuestion(int questionIndex)
        {
            if (questionIndex < questionPanel.childCount)
            {
                Transform questionItemTransform = questionPanel.GetChild(questionIndex);
                QuestionUIItem questionUIItem = questionItemTransform.GetComponent<QuestionUIItem>();
                questionUIItem.SetClosedState(false);


                PopulateOptionPanel(questionUIItem.questionSO.Options.ToList());
            }
        }

        public void PopulateOptionPanel(List<string> options)
        {
            foreach (Transform child in optionPanel)
                child.gameObject.SetActive(false);

            for (int i = 0; i < options.Count; i++)
            {
                if (i < optionPanel.childCount)
                {
                    Transform optionItemTransform = optionPanel.GetChild(i);
                    TMP_Text optionUIItem = optionItemTransform.GetComponent<TMP_Text>();
                    optionUIItem.text = options[i];
                    optionItemTransform.gameObject.SetActive(true);
                }
            }
        }

        public void OnDisable()
        {
            backButton.onClick.RemoveAllListeners();
        }
    }
}