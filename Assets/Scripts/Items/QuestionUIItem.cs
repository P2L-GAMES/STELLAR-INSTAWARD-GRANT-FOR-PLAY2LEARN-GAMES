using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Play2Earn
{
    public class QuestionUIItem : MonoBehaviour
    {

        [SerializeField] private Image backgroundImage;
        [SerializeField] private Image closedStateImage;
        [SerializeField] private TMP_Text questionText;
        [SerializeField] private Image questionImage;
        public QuestionSO questionSO;

        public void Init()
        {
            if (questionSO != null)
            {
                questionText.text = questionSO.QuestionText;
                questionImage.sprite = questionSO.QuestionImage;
            }

            SetClosedState(true);
        }

        public void SetClosedState(bool isClosed)
        {
            closedStateImage.gameObject.SetActive(isClosed);
        }

    }
}