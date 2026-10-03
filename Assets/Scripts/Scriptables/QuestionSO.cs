using UnityEngine;

namespace Play2Earn
{
    [CreateAssetMenu(fileName = "QuestionSO", menuName = "Scriptable Objects/QuestionSO")]
    public class QuestionSO : ScriptableObject
    {
        public string QuestionText;
        public Sprite QuestionImage;
        public string[] Options;
        public int CorrectOptionIndex;
    }
}