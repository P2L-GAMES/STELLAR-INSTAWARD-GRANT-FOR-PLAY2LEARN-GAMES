using System;
using UnityEngine;

namespace Play2Earn
{
    public class GameEventManager: Singleton<GameEventManager>
    {
        public Action<GameSO> OnGameSelected;
    }
}