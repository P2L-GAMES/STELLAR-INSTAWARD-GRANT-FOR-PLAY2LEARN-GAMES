using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Play2Earn
{
    public class OptionUIItem : MonoBehaviour
    {
        [SerializeField] private Image backgroundImage;
        [SerializeField] private TMP_Text optionText;
        [SerializeField] private Button optionButton;
        [SerializeField] private Color wrongColor;
        [SerializeField] private Color rightColor;
        [SerializeField] private Color selectedColor;
        [SerializeField] private Color defaultColor;

        public string value;

        public void Init()
        {
            if (!String.IsNullOrEmpty(value))
            {
                optionText.text = value;
                optionButton.onClick.AddListener(OnOptionSelected);
                gameObject.SetActive(true);
                backgroundImage.color = defaultColor;
                LockOption(false);
            }
        }

        public void OnOptionSelected()
        {
            backgroundImage.color = selectedColor;
            GameEventManager.Instance.OnOptionSelected?.Invoke(optionText.text);
        }

        public void MarkAsCorrect(bool isCorrect)
        {
            if (isCorrect)
                backgroundImage.color = rightColor;
            else
                backgroundImage.color = wrongColor;
        }


        public void LockOption(bool value)
        {
            optionButton.interactable = !value;
        }

        public void Hide()
        {
            optionButton.onClick.RemoveListener(OnOptionSelected);
            gameObject.SetActive(false);
        }
    }
}