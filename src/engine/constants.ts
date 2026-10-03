/**
 * Melee (NTSC 1.02) physics constants used by the knockback engine.
 *
 * The game keeps most of these in PlCo.dat, so the decompilation
 * (https://github.com/doldecomp/melee) shows where each one is used but not its value.
 * The values come from ikneedata's calculator (https://ikneedata.com/calculatormaths.js),
 * meleelight (https://github.com/schmooblidon/meleelight) and SmashWiki. They all agree
 * unless a comment says otherwise.
 */

/** Knockback is capped here. Source: ikneedata getKnockback, meleelight hitDetection.js. */
export const MAX_KNOCKBACK = 2500;

/**
 * Throws ignore the victim's weight and use this instead.
 * Source: decomp ftColl_80079AB0 (p_ftCommonData->x10C), ikneedata `isThrow`.
 */
export const THROW_WEIGHT = 100;

/**
 * Crouching multiplies knockback by 2/3, after the formula, so it applies to set
 * knockback too. ikneedata uses 0.667 and meleelight 0.67; SmashWiki's Knockback page
 * gives 0.666667. Source: https://www.ssbwiki.com/Crouch_cancel, decomp
 * ftCo_Damage_CalcKnockback.
 */
export const CROUCH_CANCEL_MULTIPLIER = 2 / 3;

/**
 * Stale-move negation: the game remembers the attacker's last 9 moves that connected.
 * Each time the current move appears in that queue, its damage drops by the weight for
 * that position, most recent first. Melee has no bonus for fresh moves.
 * Source: decomp ft_80089118 (loops 9 entries, weights from PlCo.dat via Fighter_804D6548),
 * disc values from meleelight-decomp-edition staling.js,
 * https://www.ssbwiki.com/Stale-move_negation.
 */
export const STALE_QUEUE_WEIGHTS = [0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01];

/** Hitstun frames per point of knockback. Source: https://www.ssbwiki.com/Hitstun. */
export const HITSTUN_PER_KNOCKBACK = 0.4;

/**
 * Knockback at or above this puts the victim in tumble (32 frames of hitstun).
 * Source: https://www.ssbwiki.com/Tumble, ikneedata and meleelight (`kb >= 80`).
 */
export const TUMBLE_THRESHOLD = 80;

/** Launch speed in units per frame for each point of knockback. Source: decomp x100, ikneedata. */
export const LAUNCH_SPEED_PER_KNOCKBACK = 0.03;

/**
 * Launch speed lost each frame, along the launch direction.
 * Source: decomp Fighter_procUpdate (x204_knockbackFrameDecay), ikneedata, meleelight.
 */
export const LAUNCH_SPEED_DECAY = 0.051;

/** The Sakurai angle is stored as this value in hitbox data. */
export const SAKURAI_ANGLE = 361;

/**
 * Sakurai angle for grounded victims: 0° below the low threshold, 44° from the high
 * threshold up, with a 0.1-wide ramp between. Source: decomp ftCo_Damage_CalcAngle
 * (x14C, x148), https://www.ssbwiki.com/Sakurai_angle.
 */
export const SAKURAI_GROUNDED_LOW_KNOCKBACK = 32;
export const SAKURAI_GROUNDED_HIGH_KNOCKBACK = 32.1;
export const SAKURAI_GROUNDED_ANGLE = 44;

/**
 * Sakurai angle for airborne victims. SmashWiki gives 45°, and the decomp uses a separate
 * constant (x144) from the grounded 44°. ikneedata uses 44° here, so 361 moves against
 * airborne victims can differ slightly from its results.
 */
export const SAKURAI_AIRBORNE_ANGLE = 45;

/**
 * Largest change DI can make to the launch angle. Source: decomp ftCo_8008E5A4 (x1A8),
 * ikneedata getAngle, https://www.ssbwiki.com/Directional_influence.
 */
export const MAX_DI_DEGREES = 18;

/** Controller stick axes run from -80 to 80 in the game's raw values. */
export const STICK_RAW_MAX = 80;

/**
 * A stick axis below this (23/80) is read as zero. Each axis is checked separately.
 * Source: ikneedata getAngle, https://github.com/CarVac/MeleeConchRuleset.
 */
export const STICK_DEADZONE = 0.2875;

/**
 * A victim crosses the top blast zone only while still rising this fast from knockback
 * alone (not counting gravity). Source: decomp ftCo_800D3158 (x4F0), ikneedata, meleelight.
 */
export const TOP_BLAST_ZONE_MIN_SPEED = 2.4;

/**
 * A grounded victim hit downward hard enough to tumble bounces off the floor, keeping
 * this share of their vertical speed. Source: decomp (x1EC), ikneedata getVerticalVelocity.
 */
export const GROUND_BOUNCE_MULTIPLIER = 0.8;

/**
 * That bounce only happens when the launch points more than this many degrees below the
 * floor. Shallower downward launches aren't reflected, so the victim lands straight away.
 * Source: decomp ftCo_8008DCE0 (compares against 90° + x1E8; x1E8 = 10° on the disc, per
 * meleelight-decomp-edition meleeCommon.js).
 */
export const GROUND_BOUNCE_MIN_DEGREES = 10;

/**
 * The simulation stops when both launch speed components fall below this, matching
 * ikneedata. Gravity alone cannot cause a KO through the top blast zone after that.
 */
export const LAUNCH_SPEED_EPSILON = 0.001;

/** Safety limit so a bad input can never loop forever (10 seconds of game time). */
export const MAX_SIMULATED_FRAMES = 600;
