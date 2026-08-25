package com.dbmusic.viral

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.LinearProgressIndicator
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.color.ColorProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private val BlueMain = Color(0xFF2563EB)
private val GrayMuted = Color(0xFF64748B)
private val TextDark = Color(0xFF1E293B)

class DBMusicWidget : GlanceAppWidget() {
    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
        val userRole = prefs.getString("userRole", null)
        val userId = prefs.getString("userId", null)

        if (userRole == null || userId == null) {
            provideContent {
                WidgetContainer {
                    Text("앱에서 로그인해주세요", style = TextStyle(fontSize = 12.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted)))
                }
            }
            return
        }

        val data = withContext(Dispatchers.IO) { fetchWidgetData(userRole, userId) }

        provideContent {
            WidgetContainer {
                if (data == null) {
                    Text("불러오지 못했어요", style = TextStyle(fontSize = 12.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted)))
                } else if (userRole == "participant") {
                    ParticipantContent(data)
                } else {
                    Text("역할: $userRole", style = TextStyle(fontSize = 12.sp, color = ColorProvider(day = TextDark, night = TextDark)))
                }
            }
        }
    }

    private fun fetchWidgetData(role: String, id: String): JSONObject? {
        return try {
            val urlStr = if (role == "admin") {
                "https://app.doubleb.kr/api/widget-data?role=$role"
            } else {
                "https://app.doubleb.kr/api/widget-data?role=$role&id=$id"
            }
            val conn = URL(urlStr).openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 5000
            conn.readTimeout = 5000
            val responseText = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()
            JSONObject(responseText)
        } catch (e: Exception) {
            null
        }
    }
}

@Composable
private fun WidgetContainer(content: @Composable () -> Unit) {
    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .appWidgetBackground()
            .background(Color.White)
            .padding(12.dp)
    ) {
        content()
    }
}

@Composable
private fun ParticipantContent(data: JSONObject) {
    val size = LocalSize.current
    // 최소 관측값(95.6dp)보다만 크면 확장 (기기별 최대 크기 편차에 안전하게 대응)
    val showExpanded = size.height > 100.dp
    val showProjects = size.height > 100.dp
    val showDivider = size.height > 300.dp

    val name = data.optString("name", "")
    val level = data.optInt("level", 1)
    val balance = data.optInt("balance", 0)
    val withdrawable = data.optInt("withdrawableBalance", 0)
    val activeProjects = data.optJSONArray("activeProjects")
    val roleLabel = if (name.isNotEmpty()) "${name}님 · 체험단" else "체험단"

    // 헤더: 로고 + (Lv.X / 이름님·체험단) 세로 두 줄
    Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
        Image(
            provider = ImageProvider(R.mipmap.ic_launcher),
            contentDescription = "로고",
            modifier = GlanceModifier.size(28.dp)
        )
        Spacer(modifier = GlanceModifier.width(6.dp))
        Column {
            Text(
                "Lv.$level",
                style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = BlueMain, night = BlueMain))
            )
            Text(
                roleLabel,
                style = TextStyle(fontSize = 9.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
            )
        }
    }
    Spacer(modifier = GlanceModifier.height(6.dp))

    if (!showExpanded) {
        Text(
            "${balance}P",
            style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = BlueMain, night = BlueMain))
        )
        Text(
            "적립 포인트",
            style = TextStyle(fontSize = 9.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
        )
    } else {
        Row(modifier = GlanceModifier.fillMaxWidth()) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                Text(
                    "${balance}P",
                    style = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark))
                )
                Text(
                    "총 적립금",
                    style = TextStyle(fontSize = 11.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
                )
            }
            Column(modifier = GlanceModifier.defaultWeight()) {
                Text(
                    "${withdrawable}P",
                    style = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = BlueMain, night = BlueMain))
                )
                Text(
                    "환전 가능 금액",
                    style = TextStyle(fontSize = 11.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
                )
            }
        }

        val minWithdraw = 10000
        if (withdrawable < minWithdraw) {
            Spacer(modifier = GlanceModifier.height(6.dp))
            LinearProgressIndicator(
                modifier = GlanceModifier.fillMaxWidth().height(5.dp),
                progress = (withdrawable.toFloat() / minWithdraw.toFloat()).coerceIn(0f, 1f),
                color = ColorProvider(day = BlueMain, night = BlueMain),
                backgroundColor = ColorProvider(day = Color(0xFFE2E8F0), night = Color(0xFFE2E8F0))
            )
            Spacer(modifier = GlanceModifier.height(3.dp))
            Text(
                "${minWithdraw - withdrawable}P 더 모으면 환전 가능해요",
                style = TextStyle(fontSize = 10.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
            )
        }

        if (showDivider) {
            Spacer(modifier = GlanceModifier.height(8.dp))
            Row(modifier = GlanceModifier.fillMaxWidth().height(1.dp).background(Color(0xFFE2E8F0))) {}
        }

        if (showProjects) {
            Spacer(modifier = GlanceModifier.height(8.dp))
            val firstProject = activeProjects?.optJSONObject(0)
            Text(
                firstProject?.optString("name", "") ?: "참여중인 프로젝트가 없어요",
                style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark))
            )
        }
    }
}

class DBMusicWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = DBMusicWidget()
}
