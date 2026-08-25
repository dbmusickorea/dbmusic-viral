package com.dbmusic.viral

import android.content.Context
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import androidx.glance.appwidget.updateAll
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "WidgetData")
class WidgetDataPlugin : Plugin() {
    private val prefsName = "widget_prefs"

    @PluginMethod
    fun saveUserInfo(call: PluginCall) {
        val role = call.getString("role")
        val id = call.getString("id")
        if (role == null || id == null) {
            call.reject("role, id 필요")
            return
        }
        val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        prefs.edit().putString("userRole", role).putString("userId", id).apply()

        CoroutineScope(Dispatchers.IO).launch {
            DBMusicWidget().updateAll(context)
        }

        call.resolve()
    }

    @PluginMethod
    fun clearUserInfo(call: PluginCall) {
        val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        prefs.edit().remove("userRole").remove("userId").apply()

        CoroutineScope(Dispatchers.IO).launch {
            DBMusicWidget().updateAll(context)
        }

        call.resolve()
    }
}
