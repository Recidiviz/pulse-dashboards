// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================
import { ascending, descending } from "d3-array";

import { InputPoint, SwarmPoint } from "./types";

/**
 * Calculates a swarm layout for the given data. Returns a transformed dataset
 * that includes swarm layout positions and the final extent of that swarm's spread.
 *
 * Coordinates are plotted along two axes:
 * - the `position` axis, which transforms the value according to the provided scale function
 * - the `spreadOffset` axis, which is centered on 0 and offsets the circles to prevent overlaps
 *   without distorting the values
 *
 * These axes can be used interchangeably as x or y values.
 *
 * By default, `swarmSpread` will fit the entire swarm with no overlaps. If `spread` is passed,
 * then the final spread will be fixed to this value regardless of the size of the swarm.
 * Circles will overlap as needed to avoid exceeding `spread`.
 */
export function calculateSwarm(data: InputPoint[], spread?: number) {
  const unconstrainedSwarmPoints: SwarmPoint[] = data
    .map(initializeSwarm)
    // points will be placed in this order
    .sort(sortSwarm)
    .reduce(placementReducer, []);

  const swarmSpread =
    spread ?? calculateRequiredSpread(unconstrainedSwarmPoints);

  const swarmPoints = unconstrainedSwarmPoints.map(
    handleOverflowingCircles(swarmSpread)
  );

  return {
    swarmSpread,
    swarmPoints,
  };
}

// algorithm and implementation adapted from
// https://observablehq.com/@yurivish/building-a-better-beeswarm

const { sqrt, abs, max } = Math;

/**
 * Transforms input data into SwarmPoint objects
 */
function initializeSwarm(d: InputPoint): SwarmPoint {
  return {
    ...d,
    // this is the default value, treated as the vertical center of the swarm;
    // it may be replaced later to prevent overlapping circles
    spreadOffset: 0,
  };
}

function sortSwarm(a: SwarmPoint, b: SwarmPoint) {
  return descending(a.radius, b.radius) || ascending(a.position, b.position);
}

/**
 * This creates the spread placements that will actually create the swarm layout,
 * by placing circles in order and adjusting them based on what has already been placed
 */
function placementReducer(
  placedCircles: SwarmPoint[],
  currentCircle: SwarmPoint
): SwarmPoint[] {
  const maxRadius = max(...placedCircles.map((d) => d.radius)) || 0;

  // this will collect the spread intervals between which this circle will overlap with others
  const intervals: [number, number][] = [];

  // scan circles that have already been placed,
  // starting with the closest to current for efficiency
  const placedCirclesClosestFirst = [...placedCircles].sort((a, b) =>
    ascending(
      abs(currentCircle.position - a.position),
      abs(currentCircle.position - b.position)
    )
  );
  for (let i = 0; i < placedCirclesClosestFirst.length; i += 1) {
    const otherCircle = placedCirclesClosestFirst[i];
    const requiredDistanceBetweenCenters =
      currentCircle.radius + otherCircle.radius;
    const distanceBetweenCenters = abs(
      currentCircle.position - otherCircle.position
    );
    const possibleOverlapDistance = currentCircle.radius + maxRadius;
    // stop scanning once it becomes clear that no remaining circles can possibly overlap the current one
    if (distanceBetweenCenters > possibleOverlapDistance) break;

    // ignore any circles that don't overlap the current one based on their actual radii
    // (if we use them we will get bogus offsets resulting in an incorrect layout)
    if (distanceBetweenCenters <= requiredDistanceBetweenCenters) {
      // compute the distance by which one would need to offset the circle along the spread axis
      // so that it just touches the other circle (modeled as one side of a right triangle
      // where the hypotenuse connects the centers of the two circles)
      const offset = sqrt(
        requiredDistanceBetweenCenters * requiredDistanceBetweenCenters -
          distanceBetweenCenters * distanceBetweenCenters
      );
      // use that offset to create an interval within which this circle is forbidden
      intervals.push([
        otherCircle.spreadOffset - offset,
        otherCircle.spreadOffset + offset,
      ]);
    }
  }

  // Find an offset coordinate for this circle by finding
  // the lowest point at the edge of any interval where it can fit.
  // This is quadratic in the number of intervals, but runs fast in practice due to
  // fact that we stop once the first acceptable candidate is found.
  const spreadOffset =
    intervals
      .flat()
      // sorting by absolute values to find the one closest to zero first
      .sort((a, b) => ascending(abs(a), abs(b)))
      .find((candidate) =>
        intervals.every(([lo, hi]) => candidate <= lo || candidate >= hi)
      ) ??
    // if there weren't any overlaps, retain the default offset
    currentCircle.spreadOffset;

  return [...placedCircles, { ...currentCircle, spreadOffset }];
}

/**
 * Because it's possible for circles to overflow the available spread,
 * this repositions them to overlap within that space rather than overflowing.
 * Adapts the wrapping algorithm from the R beeswarm package
 * (https://github.com/aroneklund/beeswarm/blob/d641db5/R/beeswarm.R#L281C8-L281C8)
 */
function handleOverflowingCircles(swarmSpread: number) {
  const positiveLimit = swarmSpread / 2;
  const negativeLimit = positiveLimit * -1;
  return function overflowHandler(point: SwarmPoint): SwarmPoint {
    const { spreadOffset, radius } = point;

    // adjust the allowed overflow based on this point's radius
    // to keep the entire circle within swarmSpread (not just its center)
    const negativeOverflowPoint = negativeLimit + radius;
    const positiveOverflowPoint = positiveLimit - radius;
    const paddedSpread = swarmSpread - radius * 2;

    // the result of these calculations is that overflowing points will appear to
    // reverse direction at the chart edge and start wrapping back to the center,
    // repeating this pattern as many times as necessary
    if (spreadOffset <= negativeOverflowPoint) {
      return {
        ...point,
        spreadOffset:
          positiveOverflowPoint -
          ((positiveOverflowPoint - spreadOffset) % paddedSpread),
      };
    }

    if (spreadOffset >= positiveOverflowPoint) {
      return {
        ...point,
        spreadOffset:
          ((spreadOffset - negativeOverflowPoint) % paddedSpread) +
          negativeOverflowPoint,
      };
    }

    return point;
  };
}

/**
 * Calculates how much spread is required to contain the provided points.
 */
function calculateRequiredSpread(swarmPoints: SwarmPoint[]): number {
  const farthestSpreadDistance = max(
    ...swarmPoints.map((d) => abs(d.spreadOffset))
  );
  const pointsAtFarthestDistance = swarmPoints.filter(
    (d) => abs(d.spreadOffset) === farthestSpreadDistance
  );
  const largestRadiusAtFarthestdistance = max(
    ...pointsAtFarthestDistance.map((d) => d.radius)
  );

  // double value to reflect this spread on both sides of zero
  return (farthestSpreadDistance + largestRadiusAtFarthestdistance) * 2;
}
