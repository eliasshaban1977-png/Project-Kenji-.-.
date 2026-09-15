export const KOTLIN_CODE_STRING = `package com.hammscom.cartography

import java.net.URL
import kotlin.math.*

data class CleanCelestialNode(
    val id: String,
    val displayLabel: String,
    var orbitalAngleRad: Double,
    val angularVelocity: Double
)

data class SolarDeclinationResult(
    val dayOfYear: Int,
    val declinationRad: Double,
    val declinationDeg: Double,
    val axialTiltDeg: Double,
    val equationOfTimeMinutes: Double
)

data class DawnDuskBarrierState(
    val latitudeDeg: Double,
    val longitudeDeg: Double,
    val hourAngleRad: Double,
    val hourAngleDeg: Double,
    val isPolarDay: Boolean,
    val isPolarNight: Boolean,
    val terminatorNormalVector: DoubleArray
)

data class BucketMouthNav(
    val frontSpoutRadius: Double = 160.0,
    val rearSpoutRadius: Double = 120.0,
    var siriusAntaresAngle: Double = 0.0
)

class SolarDeclinationEngine {
    companion object {
        private const val DEG_TO_RAD = PI / 180.0
        private const val RAD_TO_DEG = 180.0 / PI
        private const val MEAN_AXIAL_TILT_DEG = 23.439291
    }

    /**
     * Calculates solar declination angle using Spencer's high-precision Fourier series.
     */
    fun calculateSolarDeclination(dayOfYear: Int, julianCentury: Double = 0.26): SolarDeclinationResult {
        require(dayOfYear in 1..366) { "Day of year must be between 1 and 366" }

        val gamma = (2.0 * PI / 365.0) * (dayOfYear - 1)

        val declinationRad = 0.006918 -
                0.399912 * cos(gamma) + 0.070257 * sin(gamma) -
                0.006758 * cos(2 * gamma) + 0.000907 * sin(2 * gamma) -
                0.002697 * cos(3 * gamma) + 0.00148 * sin(3 * gamma)

        val seasonalAxialTilt = MEAN_AXIAL_TILT_DEG - (0.0130042 * julianCentury)

        val eotMinutes = 229.18 * (0.000075 +
                0.001868 * cos(gamma) - 0.032077 * sin(gamma) -
                0.014615 * cos(2 * gamma) - 0.040849 * sin(2 * gamma))

        return SolarDeclinationResult(
            dayOfYear = dayOfYear,
            declinationRad = declinationRad,
            declinationDeg = declinationRad * RAD_TO_DEG,
            axialTiltDeg = seasonalAxialTilt,
            equationOfTimeMinutes = eotMinutes
        )
    }

    /**
     * Computes the Dawn/Dusk barrier hour angle and unit plane vector 
     * over the central cartographic intersection.
     */
    fun computeDawnDuskBarrier(
        latDeg: Double,
        lonDeg: Double,
        declination: SolarDeclinationResult,
        localHourAngleRad: Double = 0.0
    ): DawnDuskBarrierState {
        val latRad = latDeg * DEG_TO_RAD
        val decRad = declination.declinationRad

        val cosHourAngle = -tan(latRad) * tan(decRad)

        var isPolarDay = false
        var isPolarNight = false
        val hourAngleRad: Double = when {
            cosHourAngle <= -1.0 -> {
                isPolarDay = true
                PI
            }
            cosHourAngle >= 1.0 -> {
                isPolarNight = true
                0.0
            }
            else -> acos(cosHourAngle)
        }

        val h = localHourAngleRad
        val eastComponent = cos(decRad) * sin(h)
        val northComponent = sin(latRad) * cos(decRad) * cos(h) - cos(latRad) * sin(decRad)
        val upComponent = cos(latRad) * cos(decRad) * cos(h) + sin(latRad) * sin(decRad)

        val normalVector = doubleArrayOf(eastComponent, northComponent, upComponent)

        return DawnDuskBarrierState(
            latitudeDeg = latDeg,
            longitudeDeg = lonDeg,
            hourAngleRad = hourAngleRad,
            hourAngleDeg = hourAngleRad * RAD_TO_DEG,
            isPolarDay = isPolarDay,
            isPolarNight = isPolarNight,
            terminatorNormalVector = normalVector
        )
    }
}

class MudosCleanLabelEngine {
    private val endpoint = URL("http://www.hammscom.mysite.com/cartography.html")
    private val droneEndpoint = URL("http://www.hammscom.mysite.com/drones.html")
    
    val solarEngine = SolarDeclinationEngine()
    val sunNode = CleanCelestialNode("SOL_01", "Sun", PI / 3, 0.0020)
    val moonNode = CleanCelestialNode("LUNA_01", "The Moon", 0.0, 0.0016)
    val bucketNav = BucketMouthNav()

    fun tick(dayOfYear: Int, latDeg: Double, lonDeg: Double): String {
        sunNode.orbitalAngleRad = (sunNode.orbitalAngleRad + sunNode.angularVelocity) % (2 * PI)
        moonNode.orbitalAngleRad = (moonNode.orbitalAngleRad + moonNode.angularVelocity) % (2 * PI)
        bucketNav.siriusAntaresAngle = (bucketNav.siriusAntaresAngle + 0.0008) % (2 * PI)

        val decResult = solarEngine.calculateSolarDeclination(dayOfYear)
        val barrierState = solarEngine.computeDawnDuskBarrier(latDeg, lonDeg, decResult, sunNode.orbitalAngleRad)

        val state = if (!barrierState.isPolarNight && sin(sunNode.orbitalAngleRad) > 0.0) "DAYLIGHT (DAWN PASS)" else "NIGHT (DUSK PASS)"
        
        return "Center Zenith Telemetry | Lat: %.2f° | Declination: %.2f° | Tilt: %.2f° | Status: %s".format(
            latDeg, decResult.declinationDeg, decResult.axialTiltDeg, state
        )
    }
}

data class GoogleMapsMountainNode(
    val id: String,
    val mountainName: String,
    val lat: Double,
    val lng: Double,
    val baseIndex: Int
)

data class SafaMarwaCanopyAnchor(
    val name: String = "Safa and Marwa Landmark",
    val lat: Double = 21.4229,
    val lng: Double = 39.8262,
    val isCanopyZenithCenter: Boolean = true
)

class GoogleMapsCartographyEngine {
    // 4 Mountain Bases mapped for Google Maps API overlay
    val mountainBases = listOf(
        GoogleMapsMountainNode("BASE_1", "Mount Kenya", -0.1521, 37.3084, 1),
        GoogleMapsMountainNode("BASE_2", "Pico da Tijuca (Rio)", -22.9519, -43.2105, 2),
        GoogleMapsMountainNode("BASE_3", "Flattop Mountain (Anchorage)", 61.0886, -149.6644, 3),
        GoogleMapsMountainNode("BASE_4", "Mount Fuji (Japan)", 35.3606, 138.7274, 4)
    )

    val canopyAnchor = SafaMarwaCanopyAnchor()

    fun renderGoogleMapsOverlayPayload(): String {
        return """
            {
              "canopy_zenith": {
                "landmark": "\${canopyAnchor.name}",
                "lat": \${canopyAnchor.lat},
                "lng": \${canopyAnchor.lng}
              },
              "mountain_bases": \${mountainBases.map { "{ id: '\${it.id}', name: '\${it.mountainName}', lat: \${it.lat}, lng: \${it.lng} }" }}
            }
        """.trimIndent()
    }
}`;
