package com.dbmusic.viral;

import android.content.res.Configuration;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetDataPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // 폴더블 기기의 접힘/펼침 등으로 화면 설정이 바뀔 때 웹뷰가 새 크기에 맞게
        // 다시 그려지도록 함 (안드로이드 공식 가이드에서 권장하는 처리)
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().invalidate();
        }
    }
}