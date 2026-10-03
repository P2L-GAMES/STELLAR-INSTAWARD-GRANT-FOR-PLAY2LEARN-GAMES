using UnityEngine;

namespace Play2Earn
{
    [CreateAssetMenu(fileName = "GameSO", menuName = "Scriptable Objects/GameSO")]
    public class GameSO : ScriptableObject
    {
        public string Name;
        public string Description;
        public Sprite Icon;
        public GameType GameType;
        public QuestionSO[] Questions;
    }

}
