package com.dbmusic.viral;

import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetDataPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // 웹뷰의 렌더러 프로세스가 죽으면(폴더블 기기의 화면 전환 등으로 메모리 부담이 커질 때 발생 가능)
        // 기본 동작은 앱 전체가 강제종료되는 것이므로, 대신 액티비티를 다시 만들어 복구하도록 처리
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
                @Override
                public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                    view.destroy();
                    recreate();
                    return true;
                }
            });
        }
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