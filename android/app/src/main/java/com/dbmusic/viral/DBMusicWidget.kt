package com.dbmusic.viral

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.provideContent
import androidx.glance.text.Text

class DBMusicWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
        val userRole = prefs.getString("userRole", null)
        val userId = prefs.getString("userId", null)

        provideContent {
            if (userRole == null || userId == null) {
                Text("앱에서 로그인해주세요")
            } else {
                Text("로그인됨: $userRole ($userId)")
            }
        }
    }
}

class DBMusicWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = DBMusicWidget()
}
