using System;
using UnityEngine;

namespace Play2Earn
{
    public class GameEventManager : Singleton<GameEventManager>
    {
        public Action<GameSO> OnGameSelected;
        public Action<QuestionSO> OnQuestionSelected;
        public Action<string> OnOptionSelected;
        public Action<string, string, bool> OnQuestionAnswered;
    }
}