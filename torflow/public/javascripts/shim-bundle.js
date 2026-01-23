(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {

    "use strict";

    var Vec3 = require( './Vec3' ),
        Vec4 = require( './Vec4' );

    /**
     * Instantiates a Mat33 object.
     * @class Mat33
     * @classdesc A 3x3 column-major matrix.
     */
    function Mat33( that ) {
        if ( that ) {
            if ( that.data instanceof Array ) {
                if ( that.data.length === 9 ) {
                    // copy Mat33 data by value
                    this.data = that.data.slice( 0 );
                } else {
                    // copy Mat44 data by value, account for index differences
                    this.data = [
                        that.data[0], that.data[1], that.data[2],
                        that.data[4], that.data[5], that.data[6],
                        that.data[8], that.data[9], that.data[10] ];
                }
            } else if ( that.length === 9 ) {
                // copy array by value, use prototype to cast array buffers
                this.data = Array.prototype.slice.call( that );
            } else {
                return Mat33.identity();
            }
        } else {
            return Mat33.identity();
        }
    }

    /**
     * Returns a column of the matrix as a Vec3 object.
     * @memberof Mat33
     *
     * @param {number} index - The 0-based column index.
     *
     * @returns {Vec3} The column vector.
     */
    Mat33.prototype.row = function( index ) {
        return new Vec3(
            this.data[0+index],
            this.data[3+index],
            this.data[6+index] );
    };

    /**
     * Returns a row of the matrix as a Vec3 object.
     * @memberof Mat33
     *
     * @param {number} index - The 0-based row index.
     *
     * @returns {Vec3} The column vector.
     */
    Mat33.prototype.col = function( index ) {
        return new Vec3(
            this.data[0+index*3],
            this.data[1+index*3],
            this.data[2+index*3] );
    };

    /**
     * Returns the identity matrix.
     * @memberof Mat33
     *
     * @returns {Mat33} The identiy matrix.
     */
    Mat33.identity = function() {
        return new Mat33([ 1, 0, 0,
            0, 1, 0,
            0, 0, 1 ]);
    };

    /**
     * Returns a scale matrix.
     * @memberof Mat33
     *
     * @param {Vec3|Array|number} scale - The scalar or vector scaling factor.
     *
     * @returns {Mat33} The scale matrix.
     */
    Mat33.scale = function( scale ) {
        if ( typeof scale === "number" ) {
            return new Mat33([
                scale, 0, 0,
                0, scale, 0,
                0, 0, scale ]);
        } else if ( scale instanceof Array ) {
            return new Mat33([
                scale[0], 0, 0,
                0, scale[1], 0,
                0, 0, scale[2] ]);
        }
        return new Mat33([
            scale.x, 0, 0,
            0, scale.y, 0,
            0, 0, scale.z ]);
    };

    /**
     * Returns a rotation matrix defined by an axis and an angle.
     * @memberof Mat33
     *
     * @param {number} angle - The angle of the rotation, in degrees.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Mat33} The rotation matrix.
     */
    Mat33.rotationDegrees = function( angle, axis ) {
        return this.rotationRadians( angle*Math.PI/180, axis );
    };

    /**
     * Returns a rotation matrix defined by an axis and an angle.
     * @memberof Mat33
     *
     * @param {number} angle - The angle of the rotation, in radians.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Mat33} The rotation matrix.
     */
    Mat33.rotationRadians = function( angle, axis ) {
        if ( axis instanceof Array ) {
            axis = new Vec3( axis );
        }
        // zero vector, return identity
        if ( axis.lengthSquared() === 0 ) {
            return this.identity();
        }
        var normAxis = axis.normalize(),
            x = normAxis.x,
            y = normAxis.y,
            z = normAxis.z,
            modAngle = ( angle > 0 ) ? angle % (2*Math.PI) : angle % (-2*Math.PI),
            s = Math.sin( modAngle ),
            c = Math.cos( modAngle ),
            xx = x * x,
            yy = y * y,
            zz = z * z,
            xy = x * y,
            yz = y * z,
            zx = z * x,
            xs = x * s,
            ys = y * s,
            zs = z * s,
            one_c = 1.0 - c;
        return new Mat33([
            (one_c * xx) + c, (one_c * xy) + zs, (one_c * zx) - ys,
            (one_c * xy) - zs, (one_c * yy) + c, (one_c * yz) + xs,
            (one_c * zx) + ys, (one_c * yz) - xs, (one_c * zz) + c
        ]);
    };

    /**
     * Returns a rotation matrix to rotate a vector from one direction to
     * another.
     * @memberof Mat33
     *
     * @param {Vec3} from - The starting direction.
     * @param {Vec3} to - The ending direction.
     *
     * @returns {Mat33} The matrix representing the rotation.
     */
    Mat33.rotationFromTo = function( fromVec, toVec ) {
        /*Builds the rotation matrix that rotates one vector into another.

        The generated rotation matrix will rotate the vector from into
        the Vector3<var> to. from and to must be unit Vector3<var>s!

        This method is based on the code from:

        Tomas Mller, John Hughes
        Efficiently Building a Matrix to Rotate One Vector to Another
        Journal of Graphics Tools, 4(4):1-4, 1999
        */
        var EPSILON = 0.000001,
            from = new Vec3( fromVec ).normalize(),
            to = new Vec3( toVec ).normalize(),
            e = from.dot( to ),
            f = Math.abs( e ),
            that = new Mat33(),
            x, u, v,
            fx, fy, fz,
            ux, uz,
            c1, c2, c3;
        if ( f > ( 1.0-EPSILON ) ) {
            // "from" and "to" almost parallel
            // nearly orthogonal
            fx = Math.abs( from.x );
            fy = Math.abs( from.y );
            fz = Math.abs( from.z );
            if (fx < fy) {
                if (fx<fz) {
                    x = new Vec3( 1, 0, 0 );
                } else {
                    x = new Vec3( 0, 0, 1 );
                }
            } else {
                if (fy < fz) {
                    x = new Vec3( 0, 1, 0 );
                } else {
                    x = new Vec3( 0, 0, 1 );
                }
            }
            u = x.sub( from );
            v = x.sub( to );
            c1 = 2.0 / u.dot( u );
            c2 = 2.0 / v.dot( v );
            c3 = c1*c2 * u.dot( v );
            // set matrix entries
            that.data[0] = - c1*u.x*u.x - c2*v.x*v.x + c3*v.x*u.x;
            that.data[3] = - c1*u.x*u.y - c2*v.x*v.y + c3*v.x*u.y;
            that.data[6] = - c1*u.x*u.z - c2*v.x*v.z + c3*v.x*u.z;
            that.data[1] = - c1*u.y*u.x - c2*v.y*v.x + c3*v.y*u.x;
            that.data[4] = - c1*u.y*u.y - c2*v.y*v.y + c3*v.y*u.y;
            that.data[7] = - c1*u.y*u.z - c2*v.y*v.z + c3*v.y*u.z;
            that.data[2] = - c1*u.z*u.x - c2*v.z*v.x + c3*v.z*u.x;
            that.data[5] = - c1*u.z*u.y - c2*v.z*v.y + c3*v.z*u.y;
            that.data[8] = - c1*u.z*u.z - c2*v.z*v.z + c3*v.z*u.z;
            that.data[0] += 1.0;
            that.data[4] += 1.0;
            that.data[8] += 1.0;
        } else {
            // the most common case, unless "from"="to", or "to"=-"from"
            v = from.cross( to );
            u = 1.0 / ( 1.0 + e );    // optimization by Gottfried Chen
            ux = u * v.x;
            uz = u * v.z;
            c1 = ux * v.y;
            c2 = ux * v.z;
            c3 = uz * v.y;
            that.data[0] = e + ux * v.x;
            that.data[3] = c1 - v.z;
            that.data[6] = c2 + v.y;
            that.data[1] = c1 + v.z;
            that.data[4] = e + u * v.y * v.y;
            that.data[7] = c3 - v.x;
            that.data[2] = c2 - v.y;
            that.data[5] = c3 + v.x;
            that.data[8] = e + uz * v.z;
        }
        return that;
    };

    /**
     * Adds the matrix with the provided matrix argument, returning a new Ma33
     * object.
     * @memberof Mat33
     *
     * @param {Mat33|Mat44|Array} that - The matrix to add.
     *
     * @returns {Mat33} The sum of the two matrices.
     */
    Mat33.prototype.add = function( that ) {
        var mat = new Mat33( that ),
            i;
        for ( i=0; i<9; i++ ) {
            mat.data[i] += this.data[i];
        }
        return mat;
    };

    /**
     * Subtracts the provided matrix argument from the matrix, returning a new
     * Mat33 object.
     * @memberof Mat33
     *
     * @param {Mat33|Mat44|Array} that - The matrix to add.
     *
     * @returns {Mat33} The difference of the two matrices.
     */
    Mat33.prototype.sub = function( that ) {
        var mat = new Mat33( that ),
            i;
        for ( i=0; i<9; i++ ) {
            mat.data[i] = this.data[i] - mat.data[i];
        }
        return mat;
    };

    /**
     * Multiplies the provded vector argument by the matrix, returning a new
     * Vec3 object.
     * @memberof Mat33
     *
     * @param {Vec3|Vec4|Array} - The vector to be multiplied by the matrix.
     *
     * @returns {Vec3} The resulting vector.
     */
    Mat33.prototype.multVector = function( that ) {
        // ensure 'that' is a Vec3
        // it is safe to only cast if Array since the .w of a Vec4 is not used
        that = ( that instanceof Array ) ? new Vec3( that ) : that;
        return new Vec3({
            x: this.data[0] * that.x + this.data[3] * that.y + this.data[6] * that.z,
            y: this.data[1] * that.x + this.data[4] * that.y + this.data[7] * that.z,
            z: this.data[2] * that.x + this.data[5] * that.y + this.data[8] * that.z
        });
    };

    /**
     * Multiplies all components of the matrix by the provded scalar argument,
     * returning a new Mat33 object.
     * @memberof Mat33
     *
     * @param {number} - The scalar to multiply the matrix by.
     *
     * @returns {Mat33} The resulting matrix.
     */
    Mat33.prototype.multScalar = function( that ) {
        var mat = new Mat33(),
            i;
        for ( i=0; i<9; i++ ) {
            mat.data[i] = this.data[i] * that;
        }
        return mat;
    };

    /**
     * Multiplies the provded matrix argument by the matrix, returning a new
     * Mat33 object.
     * @memberof Mat33
     *
     * @param {Mat33|Mat44} - The matrix to be multiplied by the matrix.
     *
     * @returns {Mat33} The resulting matrix.
     */
    Mat33.prototype.multMatrix = function( that ) {
        var mat = new Mat33(),
            i;
        // ensure 'that' is a Mat33
        // must check if Array or Mat33
        if ( ( that.data && that.data.length === 16 ) ||
            that instanceof Array ) {
            that = new Mat33( that );
        }
        for ( i=0; i<3; i++ ) {
            mat.data[i] = this.data[i] * that.data[0] + this.data[i+3] * that.data[1] + this.data[i+6] * that.data[2];
            mat.data[i+3] = this.data[i] * that.data[3] + this.data[i+3] * that.data[4] + this.data[i+6] * that.data[5];
            mat.data[i+6] = this.data[i] * that.data[6] + this.data[i+3] * that.data[7] + this.data[i+6] * that.data[8];
        }
        return mat;
    };

    /**
     * Multiplies the provded argument by the matrix.
     * @memberof Mat33
     *
     * @param {Vec3|Vec4|Mat33|Mat44|Array|number} - The argument to be multiplied by the matrix.
     *
     * @returns {Mat33|Vec3} The resulting product.
     */
    Mat33.prototype.mult = function( that ) {
        if ( typeof that === "number" ) {
            // scalar
            return this.multScalar( that );
        } else if ( that instanceof Array ) {
            // array
            if ( that.length === 3 || that.length === 4 ) {
                return this.multVector( that );
            } else {
                return this.multMatrix( that );
            }
        }
        // vector
        if ( that.x !== undefined &&
            that.y !== undefined &&
            that.z !== undefined ) {
            return this.multVector( that );
        }
        // matrix
        return this.multMatrix( that );
    };

    /**
     * Divides all components of the matrix by the provded scalar argument,
     * returning a new Mat33 object.
     * @memberof Mat33
     *
     * @param {number} - The scalar to divide the matrix by.
     *
     * @returns {Mat33} The resulting matrix.
     */
    Mat33.prototype.div = function( that ) {
        var mat = new Mat33(),
            i;
        for ( i=0; i<9; i++ ) {
            mat.data[i] = this.data[i] / that;
        }
        return mat;
    };

    /**
     * Returns true if the all components match those of a provided matrix.
     * An optional epsilon value may be provided.
     * @memberof Mat33
     *
     * @param {Mat33|Array} that - The matrix to test equality with.
     * @param {number} epsilon - The epsilon value. Optional.
     *
     * @returns {boolean} Whether or not the matrix components match.
     */
    Mat33.prototype.equals = function( that, epsilon ) {
        var i;
        epsilon = epsilon === undefined ? 0 : epsilon;
        for ( i=0; i<9; i++ ) {
            // awkward comparison logic is required to ensure equality passes if
            // corresponding are both undefined, NaN, or Infinity
            if ( !(
                ( this.data[i] === that.data[i] ) ||
                ( Math.abs( this.data[i] - that.data[i] ) <= epsilon )
               ) ) {
                return false;
            }
        }
        return true;
    };

    /**
     * Returns the transpose of the matrix.
     * @memberof Mat33
     *
     * @returns {Mat33} The transposed matrix.
     */
    Mat33.prototype.transpose = function() {
        var trans = new Mat33(), i;
        for ( i = 0; i < 3; i++ ) {
            trans.data[i*3]     = this.data[i];
            trans.data[(i*3)+1] = this.data[i+3];
            trans.data[(i*3)+2] = this.data[i+6];
        }
        return trans;
    };

    /**
     * Returns the inverse of the matrix.
     * @memberof Mat33
     *
     * @returns {Mat33} The inverted matrix.
     */
    Mat33.prototype.inverse = function() {
        var inv = new Mat33(), det;
        // compute inverse
        // row 1
        inv.data[0] = this.data[4]*this.data[8] - this.data[7]*this.data[5];
        inv.data[3] = -this.data[3]*this.data[8] + this.data[6]*this.data[5];
        inv.data[6] = this.data[3]*this.data[7] - this.data[6]*this.data[4];
        // row 2
        inv.data[1] = -this.data[1]*this.data[8] + this.data[7]*this.data[2];
        inv.data[4] = this.data[0]*this.data[8] - this.data[6]*this.data[2];
        inv.data[7] = -this.data[0]*this.data[7] + this.data[6]*this.data[1];
        // row 3
        inv.data[2] = this.data[1]*this.data[5] - this.data[4]*this.data[2];
        inv.data[5] = -this.data[0]*this.data[5] + this.data[3]*this.data[2];
        inv.data[8] = this.data[0]*this.data[4] - this.data[3]*this.data[1];
        // calculate determinant
        det = this.data[0]*inv.data[0] + this.data[1]*inv.data[3] + this.data[2]*inv.data[6];
        // return
        return inv.mult( 1 / det );
    };

    /**
     * Decomposes the matrix into the corresponding x, y, and z axes, along with
     * a scale.
     * @memberof Mat33
     *
     * @returns {Object} The decomposed components of the matrix.
     */
    Mat33.prototype.decompose = function() {
        var col0 = this.col( 0 ),
            col1 = this.col( 1 ),
            col2 = this.col( 2 );
        return {
            left: col0.normalize(),
            up: col1.normalize(),
            forward: col2.normalize(),
            scale: new Vec3( col0.length(), col1.length(), col2.length() )
        };
    };

    /**
     * Returns a random transform matrix composed of a rotation and scale.
     * @memberof Mat33
     *
     * @returns {Mat33} A random transform matrix.
     */
    Mat33.random = function() {
        var rot = Mat33.rotationRadians( Math.random() * 360, Vec3.random() ),
            scale = Mat33.scale( Math.random() * 10 );
        return rot.mult( scale );
    };

    /**
     * Returns a string representation of the matrix.
     * @memberof Mat33
     *
     * @returns {String} The string representation of the matrix.
     */
    Mat33.prototype.toString = function() {
        return this.data[0] +", "+ this.data[3] +", "+ this.data[6] +",\n" +
            this.data[1] +", "+ this.data[4] +", "+ this.data[7] +",\n" +
            this.data[2] +", "+ this.data[5] +", "+ this.data[8];
    };

    /**
     * Returns an array representation of the matrix.
     * @memberof Mat33
     *
     * @returns {Array} The matrix as an array.
     */
    Mat33.prototype.toArray = function() {
        return this.data.slice( 0 );
    };

    module.exports = Mat33;

}());

},{"./Vec3":7,"./Vec4":8}],2:[function(require,module,exports){
(function() {

    "use strict";

    var Vec3 = require( './Vec3' ),
        Vec4 = require( './Vec4' ),
        Mat33 = require( './Mat33' );

    /**
     * Instantiates a Mat44 object.
     * @class Mat44
     * @classdesc A 4x4 column-major matrix.
     */
    function Mat44( that ) {
        if ( that ) {
            if ( that.data instanceof Array ) {
                if ( that.data.length === 16 ) {
                    // copy Mat44 data by value
                    this.data = that.data.slice( 0 );
                } else {
                    // copy Mat33 data by value, account for index differences
                    this.data = [
                        that.data[0], that.data[1], that.data[2], 0,
                        that.data[3], that.data[4], that.data[5], 0,
                        that.data[6], that.data[7], that.data[8], 0,
                        0, 0, 0, 1 ];
                }
            } else if ( that.length === 16 ) {
                 // copy array by value, use prototype to cast array buffers
                this.data = Array.prototype.slice.call( that );
            } else {
                return Mat44.identity();
            }
        } else {
            return Mat44.identity();
        }
    }

    /**
     * Returns a column of the matrix as a Vec4 object.
     * @memberof Mat44
     *
     * @param {number} index - The 0-based column index.
     *
     * @returns {Vec4} The column vector.
     */
    Mat44.prototype.row = function( index ) {
        return new Vec4(
            this.data[0+index],
            this.data[4+index],
            this.data[8+index],
            this.data[12+index] );
    };

    /**
     * Returns a row of the matrix as a Vec4 object.
     * @memberof Mat44
     *
     * @param {number} index - The 0-based row index.
     *
     * @returns {Vec4} The column vector.
     */
    Mat44.prototype.col = function( index ) {
        return new Vec4(
            this.data[0+index*4],
            this.data[1+index*4],
            this.data[2+index*4],
            this.data[3+index*4] );
    };

    /**
     * Returns the identity matrix.
     * @memberof Mat44
     *
     * @returns {Mat44} The identiy matrix.
     */
    Mat44.identity = function() {
        return new Mat44([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1 ]);
    };

    /**
     * Returns a scale matrix.
     * @memberof Mat44
     *
     * @param {Vec3|Array|number} scale - The scalar or vector scaling factor.
     *
     * @returns {Mat44} The scale matrix.
     */
    Mat44.scale = function( scale ) {
        if ( typeof scale === "number" ) {
            return new Mat44([
                scale, 0, 0, 0,
                0, scale, 0, 0,
                0, 0, scale, 0,
                0, 0, 0, 1 ]);
        } else if ( scale instanceof Array ) {
            return new Mat44([
                scale[0], 0, 0, 0,
                0, scale[1], 0, 0,
                0, 0, scale[2], 0,
                0, 0, 0, 1 ]);
        }
        return new Mat44([
            scale.x, 0, 0, 0,
            0, scale.y, 0, 0,
            0, 0, scale.z, 0,
            0, 0, 0, 1 ]);
    };

    /**
     * Returns a translation matrix.
     * @memberof Mat44
     *
     * @param {Vec3|Array} translation - The translation vector.
     *
     * @returns {Mat44} The translation matrix.
     */
    Mat44.translation = function( translation ) {
        if ( translation instanceof Array ) {
            return new Mat44([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                translation[0], translation[1], translation[2], 1 ]);
        }
        return new Mat44([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            translation.x, translation.y, translation.z, 1 ]);
    };

    /**
     * Returns a rotation matrix defined by an axis and an angle.
     * @memberof Mat44
     *
     * @param {number} angle - The angle of the rotation, in degrees.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Mat44} The rotation matrix.
     */
    Mat44.rotationDegrees = function( angle, axis ) {
        return new Mat44( Mat33.rotationDegrees( angle, axis ) );
    };

    /**
     * Returns a rotation matrix defined by an axis and an angle.
     * @memberof Mat44
     *
     * @param {number} angle - The angle of the rotation, in radians.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Mat44} The rotation matrix.
     */
    Mat44.rotationRadians = function( angle, axis ) {
        return new Mat44( Mat33.rotationRadians( angle, axis ) );
    };

    /**
     * Returns a rotation matrix to rotate a vector from one direction to
     * another.
     * @memberof Mat44
     *
     * @param {Vec3} from - The starting direction.
     * @param {Vec3} to - The ending direction.
     *
     * @returns {Mat44} The matrix representing the rotation.
     */
    Mat44.rotationFromTo = function( fromVec, toVec ) {
        return new Mat44( Mat33.rotationFromTo( fromVec, toVec ) );
    };

    /**
     * Adds the matrix with the provided matrix argument, returning a new Ma33
     * object.
     * @memberof Mat44
     *
     * @param {Mat33|Mat44|Array} that - The matrix to add.
     *
     * @returns {Mat44} The sum of the two matrices.
     */
    Mat44.prototype.add = function( that ) {
        var mat = new Mat44( that ),
            i;
        for ( i=0; i<16; i++ ) {
            mat.data[i] += this.data[i];
        }
        return mat;
    };

    /**
     * Subtracts the provided matrix argument from the matrix, returning a new
     * Mat44 object.
     * @memberof Mat44
     *
     * @param {Mat33|Mat44|Array} that - The matrix to add.
     *
     * @returns {Mat44} The difference of the two matrices.
     */
    Mat44.prototype.sub = function( that ) {
        var mat = new Mat44( that ),
            i;
        for ( i=0; i<16; i++ ) {
            mat.data[i] = this.data[i] - mat.data[i];
        }
        return mat;
    };

    /**
     * Multiplies the provded vector argument by the matrix, returning a new
     * Vec3 object.
     * @memberof Mat44
     *
     * @param {Vec3|Vec4|Array} - The vector to be multiplied by the matrix.
     *
     * @returns {Vec3} The resulting vector.
     */
    Mat44.prototype.multVector3 = function( that ) {
        // ensure 'that' is a Vec3
        // it is safe to only cast if Array since Vec4 has own method
        that = ( that instanceof Array ) ? new Vec3( that ) : that;
        return new Vec3({
            x: this.data[0] * that.x +
                this.data[4] * that.y +
                this.data[8] * that.z + this.data[12],
            y: this.data[1] * that.x +
                this.data[5] * that.y +
                this.data[9] * that.z + this.data[13],
            z: this.data[2] * that.x +
                this.data[6] * that.y +
                this.data[10] * that.z + this.data[14]
        });
    };

    /**
     * Multiplies the provded vector argument by the matrix, returning a new
     * Vec3 object.
     * @memberof Mat44
     *
     * @param {Vec3|Vec4|Array} - The vector to be multiplied by the matrix.
     *
     * @returns {Vec4} The resulting vector.
     */
    Mat44.prototype.multVector4 = function( that ) {
        // ensure 'that' is a Vec4
        // it is safe to only cast if Array since Vec3 has own method
        that = ( that instanceof Array ) ? new Vec4( that ) : that;
        return new Vec4({
            x: this.data[0] * that.x +
                this.data[4] * that.y +
                this.data[8] * that.z +
                this.data[12] * that.w,
            y: this.data[1] * that.x +
                this.data[5] * that.y +
                this.data[9] * that.z +
                this.data[13] * that.w,
            z: this.data[2] * that.x +
                this.data[6] * that.y +
                this.data[10] * that.z +
                this.data[14] * that.w,
            w: this.data[3] * that.x +
                this.data[7] * that.y +
                this.data[11] * that.z +
                this.data[15] * that.w
        });
    };

    /**
     * Multiplies all components of the matrix by the provded scalar argument,
     * returning a new Mat44 object.
     * @memberof Mat44
     *
     * @param {number} - The scalar to multiply the matrix by.
     *
     * @returns {Mat44} The resulting matrix.
     */
    Mat44.prototype.multScalar = function( that ) {
        var mat = new Mat44(),
            i;
        for ( i=0; i<16; i++ ) {
            mat.data[i] = this.data[i] * that;
        }
        return mat;
    };

    /**
     * Multiplies the provded matrix argument by the matrix, returning a new
     * Mat44 object.
     * @memberof Mat44
     *
     * @param {Mat33|Mat44|Array} - The matrix to be multiplied by the matrix.
     *
     * @returns {Mat44} The resulting matrix.
     */
    Mat44.prototype.multMatrix = function( that ) {
        var mat = new Mat44(),
            i;
        // ensure 'that' is a Mat44
        // must check if Array or Mat44
        if ( ( that.data && that.data.length === 9 ) ||
            that instanceof Array ) {
            that = new Mat44( that );
        }
        for ( i=0; i<4; i++ ) {
            mat.data[i] = this.data[i] * that.data[0] +
                this.data[i+4] * that.data[1] +
                this.data[i+8] * that.data[2] +
                this.data[i+12] * that.data[3];
            mat.data[i+4] = this.data[i] * that.data[4] +
                this.data[i+4] * that.data[5] +
                this.data[i+8] * that.data[6] +
                this.data[i+12] * that.data[7];
            mat.data[i+8] = this.data[i] * that.data[8] +
                this.data[i+4] * that.data[9] +
                this.data[i+8] * that.data[10] +
                this.data[i+12] * that.data[11];
            mat.data[i+12] = this.data[i] * that.data[12] +
                this.data[i+4] * that.data[13] +
                this.data[i+8] * that.data[14] +
                this.data[i+12] * that.data[15];
        }
        return mat;
    };

    /**
     * Multiplies the provded argument by the matrix.
     * @memberof Mat44
     *
     * @param {Vec3|Vec4|Mat33|Mat44|Array|number} - The argument to be multiplied by the matrix.
     *
     * @returns {Mat44|Vec4} The resulting product.
     */
    Mat44.prototype.mult = function( that ) {
        if ( typeof that === "number" ) {
            // scalar
            return this.multScalar( that );
        } else if ( that instanceof Array ) {
            // array
            if ( that.length === 3 ) {
                return this.multVector3( that );
            } else if ( that.length === 4 ) {
                return this.multVector4( that );
            } else {
                return this.multMatrix( that );
            }
        }
        // vector
        if ( that.x !== undefined &&
            that.y !== undefined &&
            that.z !== undefined ) {
            if ( that.w !== undefined ) {
                // vec4
                return this.multVector4( that );
            }
            //vec3
            return this.multVector3( that );
        }
        // matrix
        return this.multMatrix( that );
    };

    /**
     * Divides all components of the matrix by the provded scalar argument,
     * returning a new Mat44 object.
     * @memberof Mat44
     *
     * @param {number} - The scalar to divide the matrix by.
     *
     * @returns {Mat44} The resulting matrix.
     */
    Mat44.prototype.div = function( that ) {
        var mat = new Mat44(), i;
        for ( i=0; i<16; i++ ) {
            mat.data[i] = this.data[i] / that;
        }
        return mat;
    };

    /**
     * Returns true if the all components match those of a provided matrix.
     * An optional epsilon value may be provided.
     * @memberof Mat44
     *
     * @param {Mat44|Array} that - The matrix to test equality with.
     * @param {number} epsilon - The epsilon value. Optional.
     *
     * @returns {boolean} Whether or not the matrix components match.
     */
    Mat44.prototype.equals = function( that, epsilon ) {
        var i;
        epsilon = epsilon === undefined ? 0 : epsilon;
        for ( i=0; i<16; i++ ) {
            // awkward comparison logic is required to ensure equality passes if
            // corresponding are both undefined, NaN, or Infinity
            if ( !(
                ( this.data[i] === that.data[i] ) ||
                ( Math.abs( this.data[i] - that.data[i] ) <= epsilon )
               ) ) {
                return false;
            }
        }
        return true;
    };

    /**
     * Returns an orthographic projection matrix.
     *
     * @param {number} left - The minimum x extent of the projection.
     * @param {number} right - The maximum x extent of the projection.
     * @param {number} bottom - The minimum y extent of the projection.
     * @param {number} top - The maximum y extent of the projection.
     * @param {number} near - The minimum z extent of the projection.
     * @param {number} far - The maximum z extent of the projection.
     *
     * @returns {Mat44} The orthographic projection matrix.
     */
    Mat44.ortho = function( left, right, bottom, top, near, far ) {
        var mat = Mat44.identity();
        mat.data[0] = 2 / ( right - left );
        mat.data[5] = 2 / ( top - bottom );
        mat.data[10] = -2 / ( far - near );
        mat.data[12] = -( ( right + left ) / ( right - left ) );
        mat.data[13] = -( ( top + bottom ) / ( top - bottom ) );
        mat.data[14] = -( ( far + near ) / ( far - near ) );
        return mat;
    };

    /**
     * Returns a perspective projection matrix.
     *
     * @param {number} fov - The field of view.
     * @param {number} aspect - The aspect ratio.
     * @param {number} zMin - The minimum y extent of the frustum.
     * @param {number} zMax - The maximum y extent of the frustum.
     *
     * @returns {Mat44} The perspective projection matrix.
     */
    Mat44.perspective = function( fov, aspect, zMin, zMax ) {
        var yMax = zMin * Math.tan( fov * ( Math.PI / 360.0 ) ),
            yMin = -yMax,
            xMin = yMin * aspect,
            xMax = -xMin,
            mat = Mat44.identity();
        mat.data[0] = (2 * zMin) / (xMax - xMin);
        mat.data[5] = (2 * zMin) / (yMax - yMin);
        mat.data[8] = (xMax + xMin) / (xMax - xMin);
        mat.data[9] = (yMax + yMin) / (yMax - yMin);
        mat.data[10] = -((zMax + zMin) / (zMax - zMin));
        mat.data[11] = -1;
        mat.data[14] = -( ( 2 * (zMax*zMin) )/(zMax - zMin));
        mat.data[15] = 0;
        return mat;
    };

    /**
     * Returns the transpose of the matrix.
     * @memberof Mat44
     *
     * @returns {Mat44} The transposed matrix.
     */
    Mat44.prototype.transpose = function() {
        var trans = new Mat44(), i;
        for ( i = 0; i < 4; i++ ) {
            trans.data[i*4] = this.data[i];
            trans.data[(i*4)+1] = this.data[i+4];
            trans.data[(i*4)+2] = this.data[i+8];
            trans.data[(i*4)+3] = this.data[i+12];
        }
        return trans;
    };

    /**
     * Returns the inverse of the matrix.
     * @memberof Mat44
     *
     * @returns {Mat44} The inverted matrix.
     */
    Mat44.prototype.inverse = function() {
        var inv = new Mat44(), det;
        // compute inverse
        // row 1
        inv.data[0] = this.data[5]*this.data[10]*this.data[15] -
            this.data[5]*this.data[11]*this.data[14] -
            this.data[9]*this.data[6]*this.data[15] +
            this.data[9]*this.data[7]*this.data[14] +
            this.data[13]*this.data[6]*this.data[11] -
            this.data[13]*this.data[7]*this.data[10];
        inv.data[4] = -this.data[4]*this.data[10]*this.data[15] +
            this.data[4]*this.data[11]*this.data[14] +
            this.data[8]*this.data[6]*this.data[15] -
            this.data[8]*this.data[7]*this.data[14] -
            this.data[12]*this.data[6]*this.data[11] +
            this.data[12]*this.data[7]*this.data[10];
        inv.data[8] = this.data[4]*this.data[9]*this.data[15] -
            this.data[4]*this.data[11]*this.data[13] -
            this.data[8]*this.data[5]*this.data[15] +
            this.data[8]*this.data[7]*this.data[13] +
            this.data[12]*this.data[5]*this.data[11] -
            this.data[12]*this.data[7]*this.data[9];
        inv.data[12] = -this.data[4]*this.data[9]*this.data[14] +
            this.data[4]*this.data[10]*this.data[13] +
            this.data[8]*this.data[5]*this.data[14] -
            this.data[8]*this.data[6]*this.data[13] -
            this.data[12]*this.data[5]*this.data[10] +
            this.data[12]*this.data[6]*this.data[9];
        // row 2
        inv.data[1] = -this.data[1]*this.data[10]*this.data[15] +
            this.data[1]*this.data[11]*this.data[14] +
            this.data[9]*this.data[2]*this.data[15] -
            this.data[9]*this.data[3]*this.data[14] -
            this.data[13]*this.data[2]*this.data[11] +
            this.data[13]*this.data[3]*this.data[10];
        inv.data[5] = this.data[0]*this.data[10]*this.data[15] -
            this.data[0]*this.data[11]*this.data[14] -
            this.data[8]*this.data[2]*this.data[15] +
            this.data[8]*this.data[3]*this.data[14] +
            this.data[12]*this.data[2]*this.data[11] -
            this.data[12]*this.data[3]*this.data[10];
        inv.data[9] = -this.data[0]*this.data[9]*this.data[15] +
            this.data[0]*this.data[11]*this.data[13] +
            this.data[8]*this.data[1]*this.data[15] -
            this.data[8]*this.data[3]*this.data[13] -
            this.data[12]*this.data[1]*this.data[11] +
            this.data[12]*this.data[3]*this.data[9];
        inv.data[13] = this.data[0]*this.data[9]*this.data[14] -
            this.data[0]*this.data[10]*this.data[13] -
            this.data[8]*this.data[1]*this.data[14] +
            this.data[8]*this.data[2]*this.data[13] +
            this.data[12]*this.data[1]*this.data[10] -
            this.data[12]*this.data[2]*this.data[9];
        // row 3
        inv.data[2] = this.data[1]*this.data[6]*this.data[15] -
            this.data[1]*this.data[7]*this.data[14] -
            this.data[5]*this.data[2]*this.data[15] +
            this.data[5]*this.data[3]*this.data[14] +
            this.data[13]*this.data[2]*this.data[7] -
            this.data[13]*this.data[3]*this.data[6];
        inv.data[6] = -this.data[0]*this.data[6]*this.data[15] +
            this.data[0]*this.data[7]*this.data[14] +
            this.data[4]*this.data[2]*this.data[15] -
            this.data[4]*this.data[3]*this.data[14] -
            this.data[12]*this.data[2]*this.data[7] +
            this.data[12]*this.data[3]*this.data[6];
        inv.data[10] = this.data[0]*this.data[5]*this.data[15] -
            this.data[0]*this.data[7]*this.data[13] -
            this.data[4]*this.data[1]*this.data[15] +
            this.data[4]*this.data[3]*this.data[13] +
            this.data[12]*this.data[1]*this.data[7] -
            this.data[12]*this.data[3]*this.data[5];
        inv.data[14] = -this.data[0]*this.data[5]*this.data[14] +
            this.data[0]*this.data[6]*this.data[13] +
            this.data[4]*this.data[1]*this.data[14] -
            this.data[4]*this.data[2]*this.data[13] -
            this.data[12]*this.data[1]*this.data[6] +
            this.data[12]*this.data[2]*this.data[5];
        // row 4
        inv.data[3] = -this.data[1]*this.data[6]*this.data[11] +
            this.data[1]*this.data[7]*this.data[10] +
            this.data[5]*this.data[2]*this.data[11] -
            this.data[5]*this.data[3]*this.data[10] -
            this.data[9]*this.data[2]*this.data[7] +
            this.data[9]*this.data[3]*this.data[6];
        inv.data[7] = this.data[0]*this.data[6]*this.data[11] -
            this.data[0]*this.data[7]*this.data[10] -
            this.data[4]*this.data[2]*this.data[11] +
            this.data[4]*this.data[3]*this.data[10] +
            this.data[8]*this.data[2]*this.data[7] -
            this.data[8]*this.data[3]*this.data[6];
        inv.data[11] = -this.data[0]*this.data[5]*this.data[11] +
            this.data[0]*this.data[7]*this.data[9] +
            this.data[4]*this.data[1]*this.data[11] -
            this.data[4]*this.data[3]*this.data[9] -
            this.data[8]*this.data[1]*this.data[7] +
            this.data[8]*this.data[3]*this.data[5];
        inv.data[15] = this.data[0]*this.data[5]*this.data[10] -
            this.data[0]*this.data[6]*this.data[9] -
            this.data[4]*this.data[1]*this.data[10] +
            this.data[4]*this.data[2]*this.data[9] +
            this.data[8]*this.data[1]*this.data[6] -
            this.data[8]*this.data[2]*this.data[5];
        // calculate determinant
        det = this.data[0]*inv.data[0] +
            this.data[1]*inv.data[4] +
            this.data[2]*inv.data[8] +
            this.data[3]*inv.data[12];
        return inv.mult( 1 / det );
    };

    /**
     * Decomposes the matrix into the corresponding x, y, and z axes, along with
     * a scale.
     * @memberof Mat44
     *
     * @returns {Object} The decomposed components of the matrix.
     */
    Mat44.prototype.decompose = function() {
        // extract transform components
        var col0 = new Vec3( this.col( 0 ) ),
            col1 = new Vec3( this.col( 1 ) ),
            col2 = new Vec3( this.col( 2 ) ),
            col3 = new Vec3( this.col( 3 ) );
        return {
            left: col0.normalize(),
            up: col1.normalize(),
            forward: col2.normalize(),
            origin: col3,
            scale: new Vec3( col0.length(), col1.length(), col2.length() )
        };
    };

    /**
     * Returns a random transform matrix composed of a rotation and scale.
     * @memberof Mat44
     *
     * @returns {Mat44} A random transform matrix.
     */
    Mat44.random = function() {
        var rot = Mat44.rotationRadians( Math.random() * 360, Vec3.random() ),
            scale = Mat44.scale( Math.random() * 10 ),
            translation = Mat44.translation( Vec3.random() );
        return translation.mult( rot.mult( scale ) );
    };

    /**
     * Returns a string representation of the matrix.
     * @memberof Mat44
     *
     * @returns {String} The string representation of the matrix.
     */
    Mat44.prototype.toString = function() {
        return this.data[0] +", "+ this.data[4] +", "+ this.data[8] +", "+ this.data[12] +",\n" +
            this.data[1] +", "+ this.data[5] +", "+ this.data[9] +", "+ this.data[13] +",\n" +
            this.data[2] +", "+ this.data[6] +", "+ this.data[10] +", "+ this.data[14] +",\n" +
            this.data[3] +", "+ this.data[7] +", "+ this.data[11] +", "+ this.data[15];
    };

    /**
     * Returns an array representation of the matrix.
     * @memberof Mat44
     *
     * @returns {Array} The matrix as an array.
     */
    Mat44.prototype.toArray = function() {
        return this.data.slice( 0 );
    };

    module.exports = Mat44;

}());

},{"./Mat33":1,"./Vec3":7,"./Vec4":8}],3:[function(require,module,exports){
(function() {

    "use strict";

    var Vec3 = require('./Vec3'),
        Mat33 = require('./Mat33');

    /**
     * Instantiates a Quaternion object.
     * @class Quaternion
     * @classdesc A quaternion representing an orientation.
     */
    function Quaternion() {
        switch ( arguments.length ) {
            case 1:
                // array or Quaternion argument
                var argument = arguments[0];
                if ( argument.w !== undefined ) {
                    this.w = argument.w;
                } else if ( argument[0] !== undefined ) {
                    this.w = argument[0];
                } else {
                    this.w = 1.0;
                }
                this.x = argument.x || argument[1] || 0.0;
                this.y = argument.y || argument[2] || 0.0;
                this.z = argument.z || argument[3] || 0.0;
                break;
            case 4:
                // individual component arguments
                this.w = arguments[0];
                this.x = arguments[1];
                this.y = arguments[2];
                this.z = arguments[3];
                break;
            default:
                this.w = 1;
                this.x = 0;
                this.y = 0;
                this.z = 0;
                break;
        }
        return this;
    }

    /**
     * Returns a quaternion that represents an oreintation matching
     * the identity matrix.
     * @memberof Quaternion
     *
     * @returns {Quaternion} The identity quaternion.
     */
    Quaternion.identity = function() {
        return new Quaternion( 1, 0, 0, 0 );
    };

    /**
     * Returns a new Quaternion with each component negated.
     * @memberof Quaternion
     *
     * @returns {Quaternion} The negated quaternion.
     */
     Quaternion.prototype.negate = function() {
        return new Quaternion( -this.w, -this.x, -this.y, -this.z );
    };

    /**
     * Concatenates the rotations of the two quaternions, returning
     * a new Quaternion object.
     * @memberof Quaternion
     *
     * @param {Quaternion|Array} that - The quaterion to concatenate.
     *
     * @returns {Quaternion} The resulting concatenated quaternion.
     */
    Quaternion.prototype.mult = function( that ) {
        that = ( that instanceof Array ) ? new Quaternion( that ) : that;
        var w = (that.w * this.w) - (that.x * this.x) - (that.y * this.y) - (that.z * this.z),
            x = this.y*that.z - this.z*that.y + this.w*that.x + this.x*that.w,
            y = this.z*that.x - this.x*that.z + this.w*that.y + this.y*that.w,
            z = this.x*that.y - this.y*that.x + this.w*that.z + this.z*that.w;
        return new Quaternion( w, x, y, z );
    };

    /**
     * Applies the orientation of the quaternion as a rotation
     * matrix to the provided vector, returning a new Vec3 object.
     * @memberof Quaternion
     *
     * @param {Vec3|Vec4|Array} that - The vector to rotate.
     *
     * @returns {Vec3} The resulting rotated vector.
     */
    Quaternion.prototype.rotate = function( that ) {
        that = ( that instanceof Array ) ? new Vec3( that ) : that;
        var vq = new Quaternion( 0, that.x, that.y, that.z ),
            r = this.mult( vq ).mult( this.inverse() );
        return new Vec3( r.x, r.y, r.z );
    };

    /**
     * Returns the rotation matrix that the quaternion represents.
     * @memberof Quaternion
     *
     * @returns {Mat33} The rotation matrix represented by the quaternion.
     */
    Quaternion.prototype.matrix = function() {
        var xx = this.x*this.x,
            yy = this.y*this.y,
            zz = this.z*this.z,
            xy = this.x*this.y,
            xz = this.x*this.z,
            xw = this.x*this.w,
            yz = this.y*this.z,
            yw = this.y*this.w,
            zw = this.z*this.w;
        return new Mat33([
            1 - 2*yy - 2*zz, 2*xy + 2*zw, 2*xz - 2*yw,
            2*xy - 2*zw, 1 - 2*xx - 2*zz, 2*yz + 2*xw,
            2*xz + 2*yw, 2*yz - 2*xw, 1 - 2*xx - 2*yy ]);
    };

    /**
     * Returns a quaternion representing the rotation defined by an axis
     * and an angle.
     * @memberof Quaternion
     *
     * @param {number} angle - The angle of the rotation, in degrees.
     * @param {Vec3|Array} axis - The axis of the rotation.
     *
     * @returns {Quaternion} The quaternion representing the rotation.
     */
    Quaternion.rotationDegrees = function( angle, axis ) {
        return Quaternion.rotationRadians( angle * ( Math.PI/180 ), axis );
    };

    /**
     * Returns a quaternion representing the rotation defined by an axis
     * and an angle.
     * @memberof Quaternion
     *
     * @param {number} angle - The angle of the rotation, in radians.
     * @param {Vec3|Array} axis - The axis of the rotation.
     *
     * @returns {Quaternion} The quaternion representing the rotation.
     */
    Quaternion.rotationRadians = function( angle, axis ) {
        if ( axis instanceof Array ) {
            axis = new Vec3( axis );
        }
        // normalize arguments
        axis = axis.normalize();
        // set quaternion for the equivolent rotation
        var modAngle = ( angle > 0 ) ? angle % (2*Math.PI) : angle % (-2*Math.PI),
            sina = Math.sin( modAngle/2 ),
            cosa = Math.cos( modAngle/2 );
        return new Quaternion(
            cosa,
            axis.x * sina,
            axis.y * sina,
            axis.z * sina ).normalize();
    };

    /**
     * Returns a quaternion that has been spherically interpolated between
     * two provided quaternions for a given t value.
     * @memberof Quaternion
     *
     * @param {Quaternion} fromRot - The rotation at t = 0.
     * @param {Quaternion} toRot - The rotation at t = 1.
     * @param {number} t - The t value, from 0 to 1.
     *
     * @returns {Quaternion} The quaternion representing the interpolated rotation.
     */
    Quaternion.slerp = function( fromRot, toRot, t ) {
        if ( fromRot instanceof Array ) {
            fromRot = new Quaternion( fromRot );
        }
        if ( toRot instanceof Array ) {
            toRot = new Quaternion( toRot );
        }
        // calculate angle between
        var cosHalfTheta = ( fromRot.w * toRot.w ) +
            ( fromRot.x * toRot.x ) +
            ( fromRot.y * toRot.y ) +
            ( fromRot.z * toRot.z );
        // if fromRot=toRot or fromRot=-toRot then theta = 0 and we can return from
        if ( Math.abs( cosHalfTheta ) >= 1 ) {
            return new Quaternion(
                fromRot.w,
                fromRot.x,
                fromRot.y,
                fromRot.z );
        }
        // cosHalfTheta must be positive to return the shortest angle
        if ( cosHalfTheta < 0 ) {
            fromRot = fromRot.negate();
            cosHalfTheta = -cosHalfTheta;
        }
        var halfTheta = Math.acos( cosHalfTheta );
        var sinHalfTheta = Math.sqrt( 1 - cosHalfTheta * cosHalfTheta );
        var scaleFrom = Math.sin( ( 1.0 - t ) * halfTheta ) / sinHalfTheta;
        var scaleTo = Math.sin( t * halfTheta ) / sinHalfTheta;
        return new Quaternion(
            fromRot.w * scaleFrom + toRot.w * scaleTo,
            fromRot.x * scaleFrom + toRot.x * scaleTo,
            fromRot.y * scaleFrom + toRot.y * scaleTo,
            fromRot.z * scaleFrom + toRot.z * scaleTo );
    };

    /**
     * Returns true if the vector components match those of a provided vector.
     * An optional epsilon value may be provided.
     * @memberof Quaternion
     *
     * @param {Quaternion|Array} - The vector to calculate the dot product with.
     * @param {number} - The epsilon value. Optional.
     *
     * @returns {boolean} Whether or not the vector components match.
     */
    Quaternion.prototype.equals = function( that, epsilon ) {
        var w = that.w !== undefined ? that.w : that[0],
            x = that.x !== undefined ? that.x : that[1],
            y = that.y !== undefined ? that.y : that[2],
            z = that.z !== undefined ? that.z : that[3];
        epsilon = epsilon === undefined ? 0 : epsilon;
        return ( this.w === w || Math.abs( this.w - w ) <= epsilon ) &&
            ( this.x === x || Math.abs( this.x - x ) <= epsilon ) &&
            ( this.y === y || Math.abs( this.y - y ) <= epsilon ) &&
            ( this.z === z || Math.abs( this.z - z ) <= epsilon );
    };

    /**
     * Returns a new Quaternion of unit length.
     * @memberof Quaternion
     *
     * @returns {Quaternion} The quaternion of unit length.
     */
    Quaternion.prototype.normalize = function() {
        var mag = Math.sqrt(
                this.x*this.x +
                this.y*this.y +
                this.z*this.z +
                this.w*this.w );
        if ( mag !== 0 ) {
            return new Quaternion(
                this.w / mag,
                this.x / mag,
                this.y / mag,
                this.z / mag );
        }
        return new Quaternion();
    };

    /**
     * Returns the conjugate of the quaternion.
     * @memberof Quaternion
     *
     * @returns {Quaternion} The conjugate of the quaternion.
     */
    Quaternion.prototype.conjugate = function() {
         return new Quaternion( this.w, -this.x, -this.y, -this.z );
    };

    /**
     * Returns the inverse of the quaternion.
     * @memberof Quaternion
     *
     * @returns {Quaternion} The inverse of the quaternion.
     */
    Quaternion.prototype.inverse = function() {
        return this.conjugate();
    };

    /**
     * Returns a random Quaternion of unit length.
     * @memberof Quaternion
     *
     * @returns {Quaternion} A random vector of unit length.
     */
    Quaternion.random = function() {
        var axis = Vec3.random().normalize(),
            angle = Math.random();
        return Quaternion.rotationRadians( angle, axis );
    };

    /**
     * Returns a string representation of the quaternion.
     * @memberof Quaternion
     *
     * @returns {String} The string representation of the quaternion.
     */
    Quaternion.prototype.toString = function() {
        return this.x + ", " + this.y + ", " + this.z + ", " + this.w;
    };

    /**
     * Returns an array representation of the quaternion.
     * @memberof Quaternion
     *
     * @returns {Array} The quaternion as an array.
     */
    Quaternion.prototype.toArray = function() {
        return [  this.w, this.x, this.y, this.z ];
    };

    module.exports = Quaternion;

}());

},{"./Mat33":1,"./Vec3":7}],4:[function(require,module,exports){
(function() {

    "use strict";

    var Vec3 = require( './Vec3' ),
        Mat33 = require( './Mat33' ),
        Mat44 = require( './Mat44' );

    /**
     * Instantiates a Transform object.
     * @class Transform
     * @classdesc A transform representing an orientation, position, and scale.
     */
    function Transform( that ) {
        that = that || {};
        if ( that._up &&
            that._forward &&
            that._left &&
            that._origin &&
            that._scale ) {
            // copy Transform by value
            this._up = that.up();
            this._forward = that.forward();
            this._left = that.left();
            this._origin = that.origin();
            this._scale = that.scale();
        } else if ( that.data && that.data instanceof Array ) {
            // Mat33 or Mat44, extract transform components from Mat44
            that = that.decompose();
            this._up = that.up;
            this._forward = that.forward;
            this._left = that.left;
            this._scale = that.scale;
            this._origin = that.origin || new Vec3( 0, 0, 0 );
        } else {
            // default to identity
            this._up = that.up ? new Vec3( that.up ).normalize() : new Vec3( 0, 1, 0 );
            this._forward = that.forward ? new Vec3( that.forward ).normalize() : new Vec3( 0, 0, 1 );
            this._left = that.left ? new Vec3( that.left ).normalize() : this._up.cross( this._forward ).normalize();
            this.origin( that.origin || new Vec3( 0, 0, 0 ) );
            this.scale( that.scale || new Vec3( 1, 1, 1 ) );
        }
        return this;
    }

    /**
     * Returns an identity transform.
     * @memberof Transform
     *
     * @returns {Transform} An identity transform.
     */
    Transform.identity = function() {
        return new Transform({
            up: new Vec3( 0, 1, 0 ),
            forward: new Vec3( 0, 0, 1 ),
            left: new Vec3( 1, 0, 0 ),
            origin: new Vec3( 0, 0, 0 ),
            scale: new Vec3( 1, 1, 1 )
        });
    };

    /**
     * If an argument is provided, sets the origin, otherwise returns the
     * origin by value.
     * @memberof Transform
     *
     * @param {Vec3|Array} origin - The origin. Optional.
     *
     * @returns {Vec3|Transform} The origin, or the transform for chaining.
     */
    Transform.prototype.origin = function( origin ) {
        if ( origin ) {
            this._origin = new Vec3( origin );
            return this;
        }
        return new Vec3( this._origin );
    };

    /**
     * If an argument is provided, sets the forward vector, otherwise returns
     * the forward vector by value. While setting, a rotation matrix from the
     * orignal forward vector to the new is used to rotate all other axes.
     * @memberof Transform
     *
     * @param {Vec3|Array} origin - The forward vector. Optional.
     *
     * @returns {Vec3|Transform} The forward vector, or the transform for chaining.
     */
    Transform.prototype.forward = function( forward ) {
        if ( forward ) {
            if ( forward instanceof Array ) {
                forward = new Vec3( forward ).normalize();
            } else {
                forward = forward.normalize();
            }
            var rot = Mat33.rotationFromTo( this._forward, forward );
            this._forward = forward;
            this._up = rot.mult( this._up ).normalize();
            this._left = rot.mult( this._left ).normalize();
            return this;
        }
        return new Vec3( this._forward );
    };

    /**
     * If an argument is provided, sets the up vector, otherwise returns
     * the up vector by value. While setting, a rotation matrix from the
     * orignal up vector to the new is used to rotate all other axes.
     * @memberof Transform
     *
     * @param {Vec3|Array} origin - The up vector. Optional.
     *
     * @returns {Vec3|Transform} The up vector, or the transform for chaining.
     */
    Transform.prototype.up = function( up ) {
        if ( up ) {
            if ( up instanceof Array ) {
                up = new Vec3( up ).normalize();
            } else {
                up = up.normalize();
            }
            var rot = Mat33.rotationFromTo( this._up, up );
            this._forward = rot.mult( this._forward ).normalize();
            this._up = up;
            this._left = rot.mult( this._left ).normalize();
            return this;
        }
        return new Vec3( this._up );
    };

    /**
     * If an argument is provided, sets the left vector, otherwise returns
     * the left vector by value. While setting, a rotation matrix from the
     * orignal left vector to the new is used to rotate all other axes.
     * @memberof Transform
     *
     * @param {Vec3|Array} origin - The left vector. Optional.
     *
     * @returns {Vec3|Transform} The left vector, or the transform for chaining.
     */
    Transform.prototype.left = function( left ) {
        if ( left ) {
            if ( left instanceof Array ) {
                left = new Vec3( left ).normalize();
            } else {
                left = left.normalize();
            }
            var rot = Mat33.rotationFromTo( this._left, left );
            this._forward = rot.mult( this._forward ).normalize();
            this._up = rot.mult( this._up ).normalize();
            this._left = left;
            return this;
        }
        return new Vec3( this._left );
    };

    /**
     * If an argument is provided, sets the sacle, otherwise returns the
     * scale by value.
     * @memberof Transform
     *
     * @param {Vec3|Array|number} scale - The scale. Optional.
     *
     * @returns {Vec3|Transform} The scale, or the transform for chaining.
     */
    Transform.prototype.scale = function( scale ) {
        if ( scale ) {
            if ( typeof scale === "number" ) {
                this._scale = new Vec3( scale, scale, scale );
            } else {
                this._scale = new Vec3( scale );
            }
            return this;
        }
        return this._scale;
    };

    /**
     * Multiplies the transform by another transform or matrix.
     * @memberof Transform
     *
     * @param {Mat33|Mat44|Transform|Array} that - The transform to multiply with.
     *
     * @returns {Transform} The resulting transform.
     */
    Transform.prototype.mult = function( that ) {
        if ( that instanceof Array ||
            that.data instanceof Array ) {
            // matrix or array
            return new Transform( this.matrix().mult( that ) );
        }
        // transform
        return new Transform( this.matrix().mult( that.matrix() ) );
    };

    /**
     * Returns the transform's scale matrix.
     * @memberof Transform
     *
     * @returns {Mat44} The scale matrix.
     */
    Transform.prototype.scaleMatrix = function() {
        return Mat44.scale( this._scale );
    };

    /**
     * Returns the transform's rotation matrix.
     * @memberof Transform
     *
     * @returns {Mat44} The rotation matrix.
     */
    Transform.prototype.rotationMatrix = function() {
        return new Mat44([
            this._left.x, this._left.y, this._left.z, 0,
            this._up.x, this._up.y, this._up.z, 0,
            this._forward.x, this._forward.y, this._forward.z, 0,
            0, 0, 0, 1 ]);
    };

    /**
     * Returns the transform's translation matrix.
     * @memberof Transform
     *
     * @returns {Mat44} The translation matrix.
     */
    Transform.prototype.translationMatrix = function() {
        return Mat44.translation( this._origin );
    };

    /**
     * Returns the transform's affine-transformation matrix.
     * @memberof Transform
     *
     * @returns {Mat44} The affine-transformation matrix.
     */
    Transform.prototype.matrix = function() {
        // T * R * S
        return this.translationMatrix()
            .mult( this.rotationMatrix() )
            .mult( this.scaleMatrix() );
    };

    /**
     * Returns the inverse of the transform's scale matrix.
     * @memberof Transform
     *
     * @returns {Mat44} The inverse scale matrix.
     */
    Transform.prototype.inverseScaleMatrix = function() {
        return Mat44.scale( new Vec3(
            1/this._scale.x,
            1/this._scale.y,
            1/this._scale.z ) );
    };

    /**
     * Returns the inverse of the transform's rotation matrix.
     * @memberof Transform
     *
     * @returns {Mat44} The inverse rotation matrix.
     */
    Transform.prototype.inverseRotationMatrix = function() {
        return new Mat44([
            this._left.x, this._up.x, this._forward.x, 0,
            this._left.y, this._up.y, this._forward.y, 0,
            this._left.z, this._up.z, this._forward.z, 0,
            0, 0, 0, 1 ]);
    };

    /**
     * Returns the inverse of the transform's translation matrix.
     * @memberof Transform
     *
     * @returns {Mat44} The inverse translation matrix.
     */
    Transform.prototype.inverseTranslationMatrix = function() {
        return Mat44.translation( this._origin.negate() );
    };

    /**
     * Returns the inverse of the transform's affine-transformation matrix.
     * @memberof Transform
     *
     * @returns {Mat44} The inverse affine-transformation matrix.
     */
    Transform.prototype.inverseMatrix = function() {
        // S^-1 * R^-1 * T^-1
        return this.inverseScaleMatrix()
            .mult( this.inverseRotationMatrix() )
            .mult( this.inverseTranslationMatrix() );
    };

    /**
     * Returns the transform's view matrix.
     * @memberof Transform
     *
     * @returns {Mat44} The view matrix.
     */
    Transform.prototype.viewMatrix = function() {
        var nOrigin = this._origin.negate(),
            right = this._left.negate(),
            backward = this._forward.negate();
        return new Mat44([
            right.x, this._up.x, backward.x, 0,
            right.y, this._up.y, backward.y, 0,
            right.z, this._up.z, backward.z, 0,
            nOrigin.dot( right ), nOrigin.dot( this._up ), nOrigin.dot( backward ), 1 ]);
    };

    /**
     * Translates the transform in world space.
     * @memberof Transform
     *
     * @param {Vec3} translation - The translation vector.
     *
     * @returns {Transform} The transform for chaining.
     */
    Transform.prototype.translateWorld = function( translation ) {
        this._origin = this._origin.add( translation );
        return this;
    };

    /**
     * Translates the transform in local space.
     * @memberof Transform
     *
     * @param {Vec3} translation - The translation vector.
     *
     * @returns {Transform} The transform for chaining.
     */
    Transform.prototype.translateLocal = function( translation ) {
        if ( translation instanceof Array ) {
            translation = new Vec3( translation );
        }
        this._origin = this._origin.add( this._left.mult( translation.x ) )
            .add( this._up.mult( translation.y ) )
            .add( this._forward.mult( translation.z ) );
        return this;
    };

    /**
     * Rotates the transform by an angle around an axis in world space.
     * @memberof Transform
     *
     * @param {number} angle - The angle of the rotation, in degrees.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Transform} The transform for chaining.
     */
    Transform.prototype.rotateWorldDegrees = function( angle, axis ) {
        return this.rotateWorldRadians( angle * Math.PI / 180, axis );
    };

    /**
     * Rotates the transform by an angle around an axis in world space.
     * @memberof Transform
     *
     * @param {number} angle - The angle of the rotation, in radians.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Transform} The transform for chaining.
     */
    Transform.prototype.rotateWorldRadians = function( angle, axis ) {
        var rot = Mat33.rotationRadians( angle, axis );
        this._up = rot.mult( this._up );
        this._forward = rot.mult( this._forward );
        this._left = rot.mult( this._left );
        return this;
    };

    /**
     * Rotates the transform by an angle around an axis in local space.
     * @memberof Transform
     *
     * @param {number} angle - The angle of the rotation, in degrees.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Transform} The transform for chaining.
     */
    Transform.prototype.rotateLocalDegrees = function( angle, axis ) {
        return this.rotateWorldDegrees( angle, this.rotationMatrix().mult( axis ) );
    };

    /**
     * Rotates the transform by an angle around an axis in local space.
     * @memberof Transform
     *
     * @param {number} angle - The angle of the rotation, in radians.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Transform} The transform for chaining.
     */
    Transform.prototype.rotateLocalRadians = function( angle, axis ) {
        return this.rotateWorldRadians( angle, this.rotationMatrix().mult( axis ) );
    };

    /**
     * Transforms the vector or matrix argument from the transforms local space
     * to the world space.
     * @memberof Transform
     *
     * @param {Vec3|Vec4|Mat33|Mat44} that - The argument to transform.
     * @param {boolean} ignoreScale - Whether or not to include the scale in the transform.
     * @param {boolean} ignoreRotation - Whether or not to include the rotation in the transform.
     * @param {boolean} ignoreTranslation - Whether or not to include the translation in the transform.
     *
     * @returns {Transform} The transform for chaining.
     */
    Transform.prototype.localToWorld = function( that, ignoreScale, ignoreRotation, ignoreTranslation ) {
        var mat = new Mat44();
        if ( !ignoreScale ) {
            mat = this.scaleMatrix().mult( mat );
        }
        if ( !ignoreRotation ) {
            mat = this.rotationMatrix().mult( mat );
        }
        if ( !ignoreTranslation ) {
            mat = this.translationMatrix().mult( mat );
        }
        return mat.mult( that );
    };

    /**
     * Transforms the vector or matrix argument from world space to the
     * transforms local space.
     * @memberof Transform
     *
     * @param {Vec3|Vec4|Mat33|Mat44} that - The argument to transform.
     * @param {boolean} ignoreScale - Whether or not to include the scale in the transform.
     * @param {boolean} ignoreRotation - Whether or not to include the rotation in the transform.
     * @param {boolean} ignoreTranslation - Whether or not to include the translation in the transform.
     *
     * @returns {Transform} The transform for chaining.
     */
    Transform.prototype.worldToLocal = function( that, ignoreScale, ignoreRotation, ignoreTranslation ) {
        var mat = new Mat44();
        if ( !ignoreTranslation ) {
            mat = this.inverseTranslationMatrix().mult( mat );
        }
        if ( !ignoreRotation ) {
            mat = this.inverseRotationMatrix().mult( mat );
        }
        if ( !ignoreScale ) {
            mat = this.inverseScaleMatrix().mult( mat );
        }
        return mat.mult( that );
    };

    /**
     * Returns true if the all components match those of a provided transform.
     * An optional epsilon value may be provided.
     * @memberof Transform
     *
     * @param {Transform} that - The matrix to test equality with.
     * @param {number} epsilon - The epsilon value. Optional.
     *
     * @returns {boolean} Whether or not the transform components match.
     */
    Transform.prototype.equals = function( that, epsilon ) {
        return this._origin.equals( that.origin(), epsilon ) &&
            this._forward.equals( that.forward(), epsilon ) &&
            this._up.equals( that.up(), epsilon ) &&
            this._left.equals( that.left(), epsilon ) &&
            this._scale.equals( that.scale(), epsilon );
    };

    /**
     * Returns a transform with a random origin, orientation, and scale.
     * @memberof Transform
     *
     * @returns {Transform} The random transform.
     */
    Transform.random = function() {
        return new Transform()
            .origin( Vec3.random() )
            .forward( Vec3.random() )
            .scale( Vec3.random() );
    };

    /**
     * Returns a string representation of the transform.
     * @memberof Transform
     *
     * @returns {String} The string representation of the transform.
     */
    Transform.prototype.toString = function() {
        return this.matrix().toString();
    };

    module.exports = Transform;

}());

},{"./Mat33":1,"./Mat44":2,"./Vec3":7}],5:[function(require,module,exports){
(function () {

    "use strict";

    var Vec3 = require('./Vec3');

    /**
     * Instantiates a Triangle object.
     * @class Triangle
     * @classdesc A CCW-winded triangle object.
     */
    function Triangle() {
        switch ( arguments.length ) {
            case 1:
                // array or object argument
                var arg = arguments[0];
                this.a = new Vec3( arg[0] || arg.a );
                this.b = new Vec3( arg[1] || arg.b );
                this.c = new Vec3( arg[2] || arg.c );
                break;
            case 3:
                // individual vector arguments
                this.a = new Vec3( arguments[0] );
                this.b = new Vec3( arguments[1] );
                this.c = new Vec3( arguments[2] );
                break;
            default:
                this.a = new Vec3( 0, 0, 0 );
                this.b = new Vec3( 1, 0, 0 );
                this.c = new Vec3( 1, 1, 0 );
                break;
        }
    }

    /**
     * Returns the radius of the bounding sphere of the triangle.
     * @memberof Triangle
     *
     * @returns {number} The radius of the bounding sphere.
     */
    Triangle.prototype.radius = function() {
        var centroid = this.centroid(),
            aDist = this.a.sub( centroid ).length(),
            bDist = this.b.sub( centroid ).length(),
            cDist = this.c.sub( centroid ).length();
        return Math.max( aDist, Math.max( bDist, cDist ) );
    };

    /**
     * Returns the centroid of the triangle.
     * @memberof Triangle
     *
     * @returns {number} The centroid of the triangle.
     */
    Triangle.prototype.centroid = function() {
        return this.a
            .add( this.b )
            .add( this.c )
            .div( 3 );
    };

    /**
     * Returns the normal of the triangle.
     * @memberof Triangle
     *
     * @returns {number} The normal of the triangle.
     */
    Triangle.prototype.normal = function() {
        var ab = this.b.sub( this.a ),
            ac = this.c.sub( this.a );
        return ab.cross( ac ).normalize();
    };

    /**
     * Returns the area of the triangle.
     * @memberof Triangle
     *
     * @returns {number} The area of the triangle.
     */
    Triangle.prototype.area = function() {
        var ab = this.b.sub( this.a ),
            ac = this.c.sub( this.a );
        return ab.cross( ac ).length();
    };

    /**
     * Returns the given edge of the triangle.
     * @memberof Triangle
     *
     * @param {string} edgeId - The id string for the edge. ex 'ab'
     *
     * @returns {number} The specified edge of the triangle.
     */
    Triangle.prototype.edge = function( edgeId ) {
        switch ( edgeId.toLowerCase() ) {
            case "ab":
                return this.b.sub( this.a );
            case "ac":
                return this.c.sub( this.a );
            case "ba":
                return this.a.sub( this.b );
            case "bc":
                return this.c.sub( this.b );
            case "ca":
                return this.a.sub( this.c );
            case "cb":
                return this.b.sub( this.c );
        }
        console.warn( "Unrecognized edge id '" + edgeId + "', returning 'null'." );
        return null;
    };

    /**
     * Returns true if the point is inside the triangle. The point must be
     * coplanar.
     * @memberof Triangle
     *
     * @param {Vec3|Array} point - The point to test.
     *
     * @returns {boolean} Whether or not the point is inside the triangle.
     */
    Triangle.prototype.isInside = function( point ) {
        var p = new Vec3( point ),
            a = this.a,
            b = this.b,
            c = this.c,
            normal = this.normal();
        // compute barycentric coords
        var totalAreaDiv = 1 / b.sub( a ).cross( c.sub( a ) ).dot( normal );
        var u = c.sub( b ).cross( p.sub( b ) ).dot( normal ).mult( totalAreaDiv );
        var v = a.sub( c ).cross( p.sub( c ) ).dot( normal ).mult( totalAreaDiv );
        // reject if outside triangle
        if ( u < 0 || v < 0 || u + v > 1 ) {
            return false;
        }
        return true;
    };

    /**
     * Intersect the triangle and return intersection information.
     * @memberof Triangle
     *
     * @param {Vec3|Array} origin - The origin of the intersection ray
     * @param {Vec3|Array} direction - The direction of the intersection ray.
     * @param {boolean} ignoreBehind - Whether or not to ignore intersections behind the origin of the ray.
     * @param {boolean} ignoreBackface - Whether or not to ignore the backface of the triangle.
     *
     * @returns {Object|boolean} The intersection information, or false if there is no intersection.
     */
    Triangle.prototype.intersect = function( origin, direction, ignoreBehind, ignoreBackface ) {
        // Compute ray/plane intersection
        var o = new Vec3( origin ),
            d = new Vec3( direction ),
            normal = this.normal();
        var dn = new Vec3( d ).dot( normal );
        if ( dn === 0 || ( ignoreBackface && dn > 0 ) ) {
            // ray is parallel to plane, or coming from behind
            return false;
        }
        var t = this.a.sub( o ).dot( normal ) / dn;
        if ( ignoreBehind && t < 0 ) {
            // plane is behind ray
            return false;
        }
        var intersection = o.add( d.mult( t ) );
        // check if point is inside the triangle
        if ( !this.isInside( intersection ) ) {
           return false;
        }
        return {
            intersection: intersection,
            normal: normal,
            t: t
        };
    };

    /**
     * Returns the closest point on the specified edge of the triangle to the
     * specified point.
     * @memberof Triangle
     *
     * @param {string} edge - The edge id to find the closest point on.
     * @param {Vec3|Array} point - The point to test.
     *
     * @returns {Vec3} The closest point on the edge.
     */
    Triangle.prototype.closestPointOnEdge = function( edge, point ) {
        var a = this[ edge[0] ],
            ab = this.edge( edge );
        // project c onto ab, computing parameterized position d(t) = a + t*(b * a)
        var t = new Vec3( point ).sub( a ).dot( ab ) / ab.dot( ab );
        // If outside segment, clamp t (and therefore d) to the closest endpoint
        if ( t < 0 ) {
            t = 0;
        }
        if ( t > 1 ) {
            t = 1;
        }
        // compute projected position from the clamped t
        return a.plus( ab.mult( t ) );
    };

    /**
     * Returns the closest point on the triangle to the specified point.
     * @memberof Triangle
     *
     * @param {Vec3|Array} point - The point to test.
     *
     * @returns {Vec3} The closest point on the edge.
     */
    Triangle.prototype.closestPoint = function( point ) {
        var e0 = this.closestPointOnEdge( 'ab', point );
        var e1 = this.closestPointOnEdge( 'bc', point );
        var e2 = this.closestPointOnEdge( 'ca', point );
        var d0 = ( e0 - point ).lengthSquared();
        var d1 = ( e1 - point ).lengthSquared();
        var d2 = ( e2 - point ).lengthSquared();
        if ( d0 < d1 ) {
            return ( d0 < d2 ) ? e0 : e2;
        } else {
            return ( d1 < d2 ) ? e1 : e2;
        }
    };

    /**
     * Returns a random Triangle of unit length.
     * @memberof Triangle
     *
     * @returns {Triangle} A random triangle of unit radius.
     */
    Triangle.random = function() {
        var a = Vec3.random(),
            b = Vec3.random(),
            c = Vec3.random(),
            centroid = a.add( b ).add( c ).div( 3 ),
            aCent = a.sub( centroid ),
            bCent = b.sub( centroid ),
            cCent = c.sub( centroid ),
            aDist = aCent.length(),
            bDist = bCent.length(),
            cDist = cCent.length(),
            maxDist = Math.max( Math.max( aDist, bDist ), cDist ),
            scale = 1 / maxDist;
        return new Triangle(
            aCent.mult( scale ),
            bCent.mult( scale ),
            cCent.mult( scale ) );
    };

    /**
     * Returns true if the vector components match those of a provided triangle.
     * An optional epsilon value may be provided.
     * @memberof Triangle
     *
     * @param {Triangle} that - The vector to test equality with.
     * @param {number} epsilon - The epsilon value. Optional.
     *
     * @returns {boolean} Whether or not the vector components match.
     */
    Triangle.prototype.equals = function( that, epsilon ) {
        epsilon = epsilon === undefined ? 0 : epsilon;
        return this.a.equals( that.a, epsilon ) &&
            this.b.equals( that.b, epsilon ) &&
            this.c.equals( that.c, epsilon );
    };

    /**
     * Returns a string representation of the vector.
     * @memberof Triangle
     *
     * @returns {String} The string representation of the vector.
     */
    Triangle.prototype.toString = function() {
        return this.a.toString() + ", " +
            this.b.toString() + ", " +
            this.c.toString();
    };

    module.exports = Triangle;

}());

},{"./Vec3":7}],6:[function(require,module,exports){
(function() {

    "use strict";

    /**
     * Instantiates a Vec2 object.
     * @class Vec2
     * @classdesc A two component vector.
     */
    function Vec2() {
        switch ( arguments.length ) {
            case 1:
                // array or VecN argument
                var argument = arguments[0];
                this.x = argument.x || argument[0] || 0.0;
                this.y = argument.y || argument[1] || 0.0;
                break;
            case 2:
                // individual component arguments
                this.x = arguments[0];
                this.y = arguments[1];
                break;
            default:
                this.x = 0;
                this.y = 0;
                break;
        }
        return this;
    }

    /**
     * Returns a new Vec2 with each component negated.
     * @memberof Vec2
     *
     * @returns {Vec2} The negated vector.
     */
    Vec2.prototype.negate = function() {
        return new Vec2( -this.x, -this.y );
    };

    /**
     * Adds the vector with the provided vector argument, returning a new Vec2
     * object representing the sum.
     * @memberof Vec2
     *
     * @param {Vec2|Vec3|Vec4|Array} that - The vector to add.
     *
     * @returns {Vec2} The sum of the two vectors.
     */
    Vec2.prototype.add = function( that ) {
        if ( that instanceof Array ) {
            return new Vec2( this.x + that[0], this.y + that[1] );
        }
        return new Vec2( this.x + that.x, this.y + that.y );
    };

    /**
     * Subtracts the provided vector argument from the vector, returning a new Vec2
     * object representing the difference.
     * @memberof Vec2
     *
     * @param {Vec2|Vec3|Vec4|Array} - The vector to subtract.
     *
     * @returns {Vec2} The difference of the two vectors.
     */
    Vec2.prototype.sub = function( that ) {
        if ( that instanceof Array ) {
            return new Vec2( this.x - that[0], this.y - that[1] );
        }
        return new Vec2( this.x - that.x, this.y - that.y );
    };

    /**
     * Multiplies the vector with the provided scalar argument, returning a new Vec2
     * object representing the scaled vector.
     * @memberof Vec2
     *
     * @param {number} - The scalar to multiply the vector by.
     *
     * @returns {Vec2} The scaled vector.
     */
    Vec2.prototype.mult = function( that ) {
        return new Vec2( this.x * that, this.y * that );
    };

    /**
     * Divides the vector with the provided scalar argument, returning a new Vec2
     * object representing the scaled vector.
     * @memberof Vec2
     *
     * @param {number} - The scalar to divide the vector by.
     *
     * @returns {Vec2} The scaled vector.
     */
    Vec2.prototype.div = function( that ) {
        return new Vec2( this.x / that, this.y / that );
    };

    /**
     * Calculates and returns the dot product of the vector and the provided
     * vector argument.
     * @memberof Vec2
     *
     * @param {Vec2|Vec3|Vec4|Array} - The other vector argument.
     *
     * @returns {number} The dot product.
     */
    Vec2.prototype.dot = function( that ) {
        if ( that instanceof Array ) {
            return ( this.x * that[0] ) + ( this.y * that[1] );
        }
        return ( this.x * that.x ) + ( this.y * that.y );
    };

    /**
     * Calculates and returns 2D cross product of the vector and the provided
     * vector argument. This value represents the magnitude of the vector that
     * would result from a regular 3D cross product of the input vectors,
     * taking their Z values as 0.
     * @memberof Vec2
     *
     * @param {Vec2|Vec3|Vec4|Array} - The other vector argument.
     *
     * @returns {number} The 2D cross product.
     */
    Vec2.prototype.cross = function( that ) {
        if ( that instanceof Array ) {
            return ( this.x * that[1] ) - ( this.y * that[0] );
        }
        return ( this.x * that.y ) - ( this.y * that.x );
    };

    /**
     * If no argument is provided, this function returns the scalar length of
     * the vector. If an argument is provided, this method will return a new
     * Vec2 scaled to the provided length.
     * @memberof Vec2
     *
     * @param {number} - The length to scale the vector to. Optional.
     *
     * @returns {number|Vec2} Either the length, or new scaled vector.
     */
    Vec2.prototype.length = function( length ) {
        if ( length === undefined ) {
            return Math.sqrt( this.dot( this ) );
        }
        return this.normalize().mult( length );
    };

    /**
     * Returns the squared length of the vector.
     * @memberof Vec2
     *
     * @returns {number} The squared length of the vector.
     */
    Vec2.prototype.lengthSquared = function() {
        return this.dot( this );
    };

    /**
     * Returns true if the vector components match those of a provided vector.
     * An optional epsilon value may be provided.
     * @memberof Vec2
     *
     * @param {Vec2|Vec3|Vec4|Array} that - The vector to test equality with.
     * @param {number} epsilon - The epsilon value. Optional.
     *
     * @returns {boolean} Whether or not the vector components match.
     */
    Vec2.prototype.equals = function( that, epsilon ) {
        var x = that.x !== undefined ? that.x : that[0],
            y = that.y !== undefined ? that.y : that[1];
        epsilon = epsilon === undefined ? 0 : epsilon;
        return ( this.x === x || Math.abs( this.x - x ) <= epsilon ) &&
            ( this.y === y || Math.abs( this.y - y ) <= epsilon );
    };

    /**
     * Returns a new Vec2 of unit length.
     * @memberof Vec2
     *
     * @returns {Vec2} The vector of unit length.
     */
    Vec2.prototype.normalize = function() {
        var mag = this.length();
        if ( mag !== 0 ) {
            return new Vec2(
                this.x / mag,
                this.y / mag );
        }
        return new Vec2();
    };

    /**
     * Returns the unsigned angle between this angle and the argument in radians.
     * @memberof Vec2
     *
     * @param {Vec2|Vec3|Vec4|Array} that - The vector to measure the angle from.
     *
     * @returns {number} The unsigned angle in radians.
     */
    Vec2.prototype.unsignedAngleRadians = function( that ) {
        var x = that.x !== undefined ? that.x : that[0];
        var y = that.y !== undefined ? that.y : that[1];
        var angle = Math.atan2( y, x ) - Math.atan2( this.y, this.x );
        if (angle < 0) {
            angle += 2 * Math.PI;
        }
        return angle;
    };

    /**
     * Returns the unsigned angle between this angle and the argument in degrees.
     * @memberof Vec2
     *
     * @param {Vec2|Vec3|Vec4|Array} that - The vector to measure the angle from.
     *
     * @returns {number} The unsigned angle in degrees.
     */
    Vec2.prototype.unsignedAngleDegrees = function( that ) {
        return this.unsignedAngleRadians( that ) * ( 180 / Math.PI );
    };

    /**
     * Returns a random Vec2 of unit length.
     * @memberof Vec2
     *
     * @returns {Vec2} A random vector of unit length.
     */
    Vec2.random = function() {
        return new Vec2(
            Math.random(),
            Math.random() ).normalize();
    };

    /**
     * Returns a string representation of the vector.
     * @memberof Vec2
     *
     * @returns {String} The string representation of the vector.
     */
    Vec2.prototype.toString = function() {
        return this.x + ", " + this.y;
    };

    /**
     * Returns an array representation of the vector.
     * @memberof Vec2
     *
     * @returns {Array} The vector as an array.
     */
    Vec2.prototype.toArray = function() {
        return [ this.x, this.y ];
    };

    module.exports = Vec2;

}());

},{}],7:[function(require,module,exports){
(function() {

    "use strict";

    /**
     * Instantiates a Vec3 object.
     * @class Vec3
     * @classdesc A three component vector.
     */
    function Vec3() {
        switch ( arguments.length ) {
            case 1:
                // array or VecN argument
                var argument = arguments[0];
                this.x = argument.x || argument[0] || 0.0;
                this.y = argument.y || argument[1] || 0.0;
                this.z = argument.z || argument[2] || 0.0;
                break;
            case 3:
                // individual component arguments
                this.x = arguments[0];
                this.y = arguments[1];
                this.z = arguments[2];
                break;
            default:
                this.x = 0.0;
                this.y = 0.0;
                this.z = 0.0;
                break;
        }
        return this;
    }

    /**
     * Returns a new Vec3 with each component negated.
     * @memberof Vec3
     *
     * @returns {Vec3} The negated vector.
     */
    Vec3.prototype.negate = function() {
        return new Vec3( -this.x, -this.y, -this.z );
    };

    /**
     * Adds the vector with the provided vector argument, returning a new Vec3
     * object representing the sum.
     * @memberof Vec3
     *
     * @param {Vec3|Vec4|Array} that - The vector to add.
     *
     * @returns {Vec3} The sum of the two vectors.
     */
    Vec3.prototype.add = function( that ) {
        if ( that instanceof Array ) {
            return new Vec3( this.x + that[0], this.y + that[1], this.z + that[2] );
        }
        return new Vec3( this.x + that.x, this.y + that.y, this.z + that.z );
    };

    /**
     * Subtracts the provided vector argument from the vector, returning a new
     * Vec3 object representing the difference.
     * @memberof Vec3
     *
     * @param {Vec3|Vec4|Array} - The vector to subtract.
     *
     * @returns {Vec3} The difference of the two vectors.
     */
    Vec3.prototype.sub = function( that ) {
        if ( that instanceof Array ) {
            return new Vec3( this.x - that[0], this.y - that[1], this.z - that[2] );
        }
        return new Vec3( this.x - that.x, this.y - that.y, this.z - that.z );
    };

    /**
     * Multiplies the vector with the provided scalar argument, returning a new Vec3
     * object representing the scaled vector.
     * @memberof Vec3
     *
     * @param {number} - The scalar to multiply the vector by.
     *
     * @returns {Vec3} The scaled vector.
     */
    Vec3.prototype.mult = function( that ) {
        return new Vec3( this.x * that, this.y * that, this.z * that );
    };

    /**
     * Divides the vector with the provided scalar argument, returning a new Vec3
     * object representing the scaled vector.
     * @memberof Vec3
     *
     * @param {number} - The scalar to divide the vector by.
     *
     * @returns {Vec3} The scaled vector.
     */
    Vec3.prototype.div = function( that ) {
        return new Vec3( this.x / that, this.y / that, this.z / that );
    };

    /**
     * Calculates and returns the dot product of the vector and the provided
     * vector argument.
     * @memberof Vec3
     *
     * @param {Vec3|Vec4|Array} - The other vector argument.
     *
     * @returns {number} The dot product.
     */
    Vec3.prototype.dot = function( that ) {
        if ( that instanceof Array ) {
            return ( this.x * that[0] ) + ( this.y * that[1] ) + ( this.z * that[2] );
        }
        return ( this.x * that.x ) + ( this.y * that.y ) + ( this.z * that.z );
    };

    /**
     * Calculates and returns the cross product of the vector and the provided
     * vector argument.
     * @memberof Vec3
     *
     * @param {Vec3|Vec4|Array} - The other vector argument.
     *
     * @returns {number} The 2D cross product.
     */
    Vec3.prototype.cross = function( that ) {
        if ( that instanceof Array ) {
            return new Vec3(
                ( this.y * that[2] ) - ( that[1] * this.z ),
                (-this.x * that[2] ) + ( that[0] * this.z ),
                ( this.x * that[1] ) - ( that[0] * this.y ) );
        }
        return new Vec3(
            ( this.y * that.z ) - ( that.y * this.z ),
            (-this.x * that.z ) + ( that.x * this.z ),
            ( this.x * that.y ) - ( that.x * this.y ) );
    };

    /**
     * If no argument is provided, this function returns the scalar length of
     * the vector. If an argument is provided, this method will return a new
     * Vec3 scaled to the provided length.
     * @memberof Vec3
     *
     * @param {number} - The length to scale the vector to. Optional.
     *
     * @returns {number|Vec3} Either the length, or new scaled vector.
     */
    Vec3.prototype.length = function( length ) {
        if ( length === undefined ) {
            return Math.sqrt( this.dot( this ) );
        }
        return this.normalize().mult( length );
    };

    /**
     * Returns the squared length of the vector.
     * @memberof Vec3
     *
     * @returns {number} The squared length of the vector.
     */
    Vec3.prototype.lengthSquared = function() {
        return this.dot( this );
    };

    /**
     * Returns true if the vector components match those of a provided vector.
     * An optional epsilon value may be provided.
     * @memberof Vec3
     *
     * @param {Vec3|Vec4|Array} that - The vector to test equality with.
     * @param {number} epsilon - The epsilon value. Optional.
     *
     * @returns {boolean} Whether or not the vector components match.
     */
    Vec3.prototype.equals = function( that, epsilon ) {
        var x = that.x !== undefined ? that.x : that[0],
            y = that.y !== undefined ? that.y : that[1],
            z = that.z !== undefined ? that.z : that[2];
        epsilon = epsilon === undefined ? 0 : epsilon;
        return ( this.x === x || Math.abs( this.x - x ) <= epsilon ) &&
            ( this.y === y || Math.abs( this.y - y ) <= epsilon ) &&
            ( this.z === z || Math.abs( this.z - z ) <= epsilon );
    };

    /**
     * Returns a new Vec3 of unit length.
     * @memberof Vec3
     *
     * @returns {Vec3} The vector of unit length.
     */
    Vec3.prototype.normalize = function() {
        var mag = this.length();
        if ( mag !== 0 ) {
            return new Vec3(
                this.x / mag,
                this.y / mag,
                this.z / mag );
        }
        return new Vec3();
    };

    /**
     * Returns the unsigned angle between this angle and the argument in radians.
     * @memberof Vec3
     *
     * @param {Vec3|Vec4|Array} that - The vector to measure the angle from.
     * @param {Vec3|Vec4|Array} normal - The reference vector to measure the
     *                              direction of the angle. If not provided will
     *                              use a.cross( b ). (Optional)
     *
     * @returns {number} The unsigned angle in radians.
     */
    Vec3.prototype.unsignedAngleRadians = function( that, normal ) {
        var a = this.normalize();
        var b = new Vec3( that ).normalize();
        var dot = a.dot( b );
        var ndot = Math.max( -1, Math.min( 1, dot ) );
        var angle = Math.acos( ndot );
        var cross = a.cross( b );
        var n = new Vec3( normal || cross );

        //var cross = this.cross( that );
        //var angle = Math.atan2( cross.length(), this.dot( that ) );

        if ( n.dot( cross ) < 0 ) {
            if ( angle >= Math.PI * 0.5 ) {
                angle = Math.PI + Math.PI - angle;
            } else {
                angle = 2 * Math.PI - angle;
            }
        }
        return angle;
    };

    /**
     * Returns the unsigned angle between this angle and the argument in degrees.
     * @memberof Vec3
     *
     * @param {Vec3|Vec4|Array} that - The vector to measure the angle from.
     *
     * @returns {number} The unsigned angle in degrees.
     */
    Vec3.prototype.unsignedAngleDegrees = function( that, normal ) {
        return this.unsignedAngleRadians( that, normal ) * ( 180 / Math.PI );
    };

    /**
     * Returns a random Vec3 of unit length.
     * @memberof Vec3
     *
     * @returns {Vec3} A random vector of unit length.
     */
    Vec3.random = function() {
        return new Vec3(
            Math.random(),
            Math.random(),
            Math.random() ).normalize();
    };

    /**
     * Returns a string representation of the vector.
     * @memberof Vec3
     *
     * @returns {String} The string representation of the vector.
     */
    Vec3.prototype.toString = function() {
        return this.x + ", " + this.y + ", " + this.z;
    };

    /**
     * Returns an array representation of the vector.
     * @memberof Vec3
     *
     * @returns {Array} The vector as an array.
     */
    Vec3.prototype.toArray = function() {
        return [ this.x, this.y, this.z ];
    };

    module.exports = Vec3;

}());

},{}],8:[function(require,module,exports){
(function() {

    "use strict";

    /**
     * Instantiates a Vec4 object.
     * @class Vec4
     * @classdesc A four component vector.
     */
    function Vec4() {
        switch ( arguments.length ) {
            case 1:
                // array or VecN argument
                var argument = arguments[0];
                this.x = argument.x || argument[0] || 0.0;
                this.y = argument.y || argument[1] || 0.0;
                this.z = argument.z || argument[2] || 0.0;
                this.w = argument.w || argument[3] || 0.0;
                break;
            case 4:
                // individual component arguments
                this.x = arguments[0];
                this.y = arguments[1];
                this.z = arguments[2];
                this.w = arguments[3];
                break;
            default:
                this.x = 0.0;
                this.y = 0.0;
                this.z = 0.0;
                this.w = 0.0;
                break;
        }
        return this;
    }

    /**
     * Returns a new Vec4 with each component negated.
     * @memberof Vec4
     *
     * @returns {Vec4} The negated vector.
     */
    Vec4.prototype.negate = function() {
        return new Vec4( -this.x, -this.y, -this.z, -this.w );
    };

    /**
     * Adds the vector with the provided vector argument, returning a new Vec4
     * object representing the sum.
     * @memberof Vec4
     *
     * @param {Vec4|Array} that - The vector to add.
     *
     * @returns {Vec4} The sum of the two vectors.
     */
    Vec4.prototype.add = function( that ) {
        if ( that instanceof Array ) {
            return new Vec4(
                this.x + that[0],
                this.y + that[1],
                this.z + that[2],
                this.w + that[3] );
        }
        return new Vec4(
            this.x + that.x,
            this.y + that.y,
            this.z + that.z,
            this.w + that.w );
    };

    /**
     * Subtracts the provided vector argument from the vector, returning a new Vec4
     * object representing the difference.
     * @memberof Vec4
     *
     * @param {Vec4|Array} - The vector to subtract.
     *
     * @returns {Vec4} The difference of the two vectors.
     */
    Vec4.prototype.sub = function( that ) {
        if ( that instanceof Array ) {
            return new Vec4(
                this.x - that[0],
                this.y - that[1],
                this.z - that[2],
                this.w - that[3] );
        }
        return new Vec4(
            this.x - that.x,
            this.y - that.y,
            this.z - that.z,
            this.w - that.w );
    };

    /**
     * Multiplies the vector with the provided scalar argument, returning a new Vec4
     * object representing the scaled vector.
     * @memberof Vec4
     *
     * @param {number} - The scalar to multiply the vector by.
     *
     * @returns {Vec4} The scaled vector.
     */
    Vec4.prototype.mult = function( that ) {
        return new Vec4(
            this.x * that,
            this.y * that,
            this.z * that,
            this.w * that );
    };

    /**
     * Divides the vector with the provided scalar argument, returning a new Vec4
     * object representing the scaled vector.
     * @memberof Vec4
     *
     * @param {number} - The scalar to divide the vector by.
     *
     * @returns {Vec4} The scaled vector.
     */
    Vec4.prototype.div = function( that ) {
        return new Vec4(
            this.x / that,
            this.y / that,
            this.z / that,
            this.w / that );
    };

    /**
     * Calculates and returns the dot product of the vector and the provided
     * vector argument.
     * @memberof Vec4
     *
     * @param {Vec4|Array} - The other vector argument.
     *
     * @returns {number} The dot product.
     */
    Vec4.prototype.dot = function( that ) {
        if ( that instanceof Array ) {
            return ( this.x * that[0] ) +
                ( this.y * that[1] ) +
                ( this.z * that[2] ) +
                ( this.w * that[3] );
        }
        return ( this.x * that.x ) +
            ( this.y * that.y ) +
            ( this.z * that.z ) +
            ( this.w * that.w );
    };

    /**
     * If no argument is provided, this function returns the scalar length of
     * the vector. If an argument is provided, this method will return a new
     * Vec4 scaled to the provided length.
     * @memberof Vec4
     *
     * @param {number} - The length to scale the vector to. Optional.
     *
     * @returns {number|Vec4} Either the length, or new scaled vector.
     */
    Vec4.prototype.length = function( length ) {
        if ( length === undefined ) {
            return Math.sqrt( this.dot( this ) );
        }
        return this.normalize().mult( length );
    };

    /**
     * Returns the squared length of the vector.
     * @memberof Vec4
     *
     * @returns {number} The squared length of the vector.
     */
    Vec4.prototype.lengthSquared = function() {
        return this.dot( this );
    };

    /**
     * Returns true if the vector components match those of a provided vector.
     * An optional epsilon value may be provided.
     * @memberof Vec4
     *
     * @param {Vec4|Array} that - The vector to test equality with.
     * @param {number} epsilon - The epsilon value. Optional.
     *
     * @returns {boolean} Whether or not the vector components match.
     */
    Vec4.prototype.equals = function( that, epsilon ) {
        var x = that.x !== undefined ? that.x : that[0],
            y = that.y !== undefined ? that.y : that[1],
            z = that.z !== undefined ? that.z : that[2],
            w = that.w !== undefined ? that.w : that[3];
        epsilon = epsilon === undefined ? 0 : epsilon;
        return ( this.x === x || Math.abs( this.x - x ) <= epsilon ) &&
            ( this.y === y || Math.abs( this.y - y ) <= epsilon ) &&
            ( this.z === z || Math.abs( this.z - z ) <= epsilon ) &&
            ( this.w === w || Math.abs( this.w - w ) <= epsilon );
    };

    /**
     * Returns a new Vec4 of unit length.
     * @memberof Vec4
     *
     * @returns {Vec4} The vector of unit length.
     */
    Vec4.prototype.normalize = function() {
        var mag = this.length();
        if ( mag !== 0 ) {
            return new Vec4(
                this.x / mag,
                this.y / mag,
                this.z / mag,
                this.w / mag );
        }
        return new Vec4();
    };

    /**
     * Returns a random Vec4 of unit length.
     * @memberof Vec4
     *
     * @returns {Vec4} A random vector of unit length.
     */
    Vec4.random = function() {
        return new Vec4(
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random() ).normalize();
    };

    /**
     * Returns a string representation of the vector.
     * @memberof Vec4
     *
     * @returns {String} The string representation of the vector.
     */
    Vec4.prototype.toString = function() {
        return this.x + ", " + this.y + ", " + this.z + ", " + this.w;
    };

    /**
     * Returns an array representation of the vector.
     * @memberof Vec4
     *
     * @returns {Array} The vector as an array.
     */
    Vec4.prototype.toArray = function() {
        return [ this.x, this.y, this.z, this.w ];
    };

    module.exports = Vec4;

}());

},{}],9:[function(require,module,exports){
(function () {

    "use strict";

    module.exports = {
        Mat33: require('./Mat33'),
        Mat44: require('./Mat44'),
        Vec2: require('./Vec2'),
        Vec3: require('./Vec3'),
        Vec4: require('./Vec3'),
        Quaternion: require('./Quaternion'),
        Transform: require('./Transform'),
        Triangle: require('./Triangle')
    };

}());

},{"./Mat33":1,"./Mat44":2,"./Quaternion":3,"./Transform":4,"./Triangle":5,"./Vec2":6,"./Vec3":7}],10:[function(require,module,exports){
(function (global){
!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var e;e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,e.esper=t()}}(function(){var t;return function e(t,r,n){function i(s,a){if(!r[s]){if(!t[s]){var u="function"==typeof require&&require;if(!a&&u)return u(s,!0);if(o)return o(s,!0);var f=new Error("Cannot find module '"+s+"'");throw f.code="MODULE_NOT_FOUND",f}var h=r[s]={exports:{}};t[s][0].call(h.exports,function(e){var r=t[s][1][e];return i(r?r:e)},h,h.exports,e,t,r,n)}return r[s].exports}for(var o="function"==typeof require&&require,s=0;s<n.length;s++)i(n[s]);return i}({1:[function(e,r,n){(function(){var e,r,i,o,s,a,u,f,h,c,l,p,d,g,m=[].slice;s="3.0.0",r="pending",o="resolved",i="rejected",h=function(t,e){return null!=t?t.hasOwnProperty(e):void 0},l=function(t){return h(t,"length")&&h(t,"callee")},p=function(t){return h(t,"promise")&&"function"==typeof(null!=t?t.promise:void 0)},f=function(t){return l(t)?f(Array.prototype.slice.call(t)):Array.isArray(t)?t.reduce(function(t,e){return Array.isArray(e)?t.concat(f(e)):(t.push(e),t)},[]):[t]},a=function(t,e){return 0>=t?e():function(){return--t<1?e.apply(this,arguments):void 0}},d=function(t,e){return function(){var r;return r=[t].concat(Array.prototype.slice.call(arguments,0)),e.apply(this,r)}},u=function(t,e,r){var n,i,o,s,a;for(s=f(t),a=[],i=0,o=s.length;o>i;i++)n=s[i],a.push(n.call.apply(n,[r].concat(m.call(e))));return a},e=function(){var t,n,s,a,h,c,l;return l=r,a=[],h=[],c=[],s={resolved:{},rejected:{},pending:{}},this.promise=function(t){var n,d;return t=t||{},t.state=function(){return l},d=function(e,n,i){return function(){return l===r&&n.push.apply(n,f(arguments)),e()&&u(arguments,s[i]),t}},t.done=d(function(){return l===o},a,o),t.fail=d(function(){return l===i},h,i),t.progress=d(function(){return l!==r},c,r),t.always=function(){var e;return(e=t.done.apply(t,arguments)).fail.apply(e,arguments)},n=function(r,n,i){var o,s;return s=new e,o=function(e,r,n){return n?t[e](function(){var t,e;return t=1<=arguments.length?m.call(arguments,0):[],e=n.apply(null,t),p(e)?e.done(s.resolve).fail(s.reject).progress(s.notify):s[r](e)}):t[e](s[r])},o("done","resolve",r),o("fail","reject",n),o("progress","notify",i),s},t.pipe=n,t.then=n,null==t.promise&&(t.promise=function(){return t}),t},this.promise(this),t=this,n=function(e,n,i){return function(){return l===r?(l=e,s[e]=arguments,u(n,s[e],i),t):this}},this.resolve=n(o,a),this.reject=n(i,h),this.notify=n(r,c),this.resolveWith=function(t,e){return n(o,a,t).apply(null,e)},this.rejectWith=function(t,e){return n(i,h,t).apply(null,e)},this.notifyWith=function(t,e){return n(r,c,t).apply(null,e)},this},g=function(){var t,r,n,i,o,s,u;if(r=f(arguments),1===r.length)return p(r[0])?r[0]:(new e).resolve(r[0]).promise();if(o=new e,!r.length)return o.resolve().promise();for(i=[],n=a(r.length,function(){return o.resolve.apply(o,i)}),r.forEach(function(t,e){return p(t)?t.done(function(){var t;return t=1<=arguments.length?m.call(arguments,0):[],i[e]=t.length>1?t:t[0],n()}):(i[e]=t,n())}),s=0,u=r.length;u>s;s++)t=r[s],p(t)&&t.fail(o.reject);return o.promise()},c=function(t){return t.Deferred=function(){return new e},t.ajax=d(t.ajax,function(t,r){var n,i,o,s;return null==r&&(r={}),i=new e,n=function(t,e){return d(t,function(){var t,r;return r=arguments[0],t=2<=arguments.length?m.call(arguments,1):[],r&&r.apply(null,t),e.apply(null,t)})},r.success=n(r.success,i.resolve),r.error=n(r.error,i.reject),s=t(r),o=i.promise(),o.abort=function(){return s.abort()},o}),t.when=g},"undefined"!=typeof n?(n.Deferred=function(){return new e},n.when=g,n.installInto=c):"function"==typeof t&&t.amd?t(function(){return"undefined"!=typeof Zepto?c(Zepto):(e.when=g,e.installInto=c,e)}):"undefined"!=typeof Zepto?c(Zepto):(this.Deferred=function(){return new e},this.Deferred.when=g,this.Deferred.installInto=c)}).call(this)},{}],2:[function(t,e,r){!function(){"use strict";function r(t,e){e=e||{},this.gl=n.get(),this.buffer=0,t&&(t instanceof WebGLBuffer?(this.buffer=t,this.type=e.type||"UNSIGNED_SHORT",this.count=void 0!==e.count?e.count:0):this.bufferData(t)),this.offset=void 0!==e.offset?e.offset:0,this.mode=void 0!==e.mode?e.mode:"TRIANGLES"}var n=t("./WebGLContext"),i=null;r.prototype.bufferData=function(t){var e=this.gl,r=n.checkExtension("OES_element_index_uint");if(r?t instanceof Array&&(t=new Uint32Array(t)):t instanceof Array?t=new Uint16Array(t):t instanceof Uint32Array&&(console.warn("Cannot create IndexBuffer of format gl.UNSIGNED_INT as OES_element_index_uint is not supported, defaulting to gl.UNSIGNED_SHORT."),t=new Uint16Array(t)),t instanceof Uint16Array)this.type="UNSIGNED_SHORT";else{if(!(t instanceof Uint32Array))return void console.error("IndexBuffer requires an Array or ArrayBuffer argument, command ignored.");this.type="UNSIGNED_INT"}return this.buffer=e.createBuffer(),this.count=t.length,e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.buffer),e.bufferData(e.ELEMENT_ARRAY_BUFFER,t,e.STATIC_DRAW),this},r.prototype.bind=function(){if(i!==this){var t=this.gl;return t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,this.buffer),i=this,this}},r.prototype.unbind=function(){if(null!==i){var t=this.gl;return t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,null),i=null,this}},r.prototype.draw=function(t){if(t=t||{},null===i)return void console.warn("No IndexBuffer is bound, command ignored.");var e=this.gl,r=e[t.mode||this.mode||"TRIANGLES"],n=void 0!==t.offset?t.offset:this.offset,o=void 0!==t.count?t.count:this.count;return e.drawElements(r,o,e[this.type],n),this},e.exports=r}()},{"./WebGLContext":12}],3:[function(t,e,r){!function(){"use strict";function r(t){if(u!==t){var e=t.gl;e.bindFramebuffer(e.FRAMEBUFFER,t.framebuffer),u=t}}function n(t){if(null!==u){var e=t.gl;e.bindFramebuffer(e.FRAMEBUFFER,null),u=null}}function i(){var t=this.gl=o.get();return this.framebuffer=t.createFramebuffer(),this.textures={},this}var o=t("./WebGLContext"),s=t("../util/Stack"),a=new s,u=null;i.prototype.push=function(){return a.push(this),r(this),this},i.prototype.pop=function(){var t;return a.pop(),t=a.top(),t?r(t):n(this),this},i.prototype.setColorTarget=function(t,e,r){var n=this.gl;return"string"==typeof e&&(r=e,e=void 0),e=void 0!==e?e:0,this.textures["color"+e]=t,this.push(),n.framebufferTexture2D(n.FRAMEBUFFER,n["COLOR_ATTACHMENT"+e],n[r||"TEXTURE_2D"],t.texture,0),this.pop(),this},i.prototype.setDepthTarget=function(t){var e=this.gl;return this.textures.depth=t,this.push(),e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,t.texture,0),this.pop(),this},i.prototype.clearColor=function(t,e,r,n){var i=this.gl;return t=void 0!==t?t:0,e=void 0!==e?e:0,r=void 0!==r?r:0,n=void 0!==n?n:0,this.push(),i.clearColor(t,e,r,n),i.clear(i.COLOR_BUFFER_BIT),this.pop(),this},i.prototype.clearDepth=function(t,e,r,n){var i=this.gl;return t=void 0!==t?t:0,e=void 0!==e?e:0,r=void 0!==r?r:0,n=void 0!==n?n:0,this.push(),i.clearColor(t,e,r,n),i.clear(i.DEPTH_BUFFER_BIT),this.pop(),this},i.prototype.clearStencil=function(t,e,r,n){var i=this.gl;return t=void 0!==t?t:0,e=void 0!==e?e:0,r=void 0!==r?r:0,n=void 0!==n?n:0,this.push(),i.clearColor(t,e,r,n),i.clear(i.STENCIL_BUFFER_BIT),this.pop(),this},i.prototype.clear=function(t,e,r,n){var i=this.gl;return t=void 0!==t?t:0,e=void 0!==e?e:0,r=void 0!==r?r:0,n=void 0!==n?n:0,this.push(),i.clearColor(t,e,r,n),i.clear(i.COLOR_BUFFER_BIT|i.DEPTH_BUFFER_BIT|i.STENCIL_BUFFER_BIT),this.pop(),this},i.prototype.resize=function(t,e){var r;if(!t||!e)return console.warn("Width or height arguments missing, command ignored."),this;for(r in this.textures)this.textures.hasOwnProperty(r)&&this.textures[r].resize(t,e);return this},e.exports=i}()},{"../util/Stack":14,"./WebGLContext":12}],4:[function(t,e,r){!function(){"use strict";function r(t,e){if(t=t||{},e=e||{},t.vertexBuffer||t.vertexBuffers)this.vertexBuffers=t.vertexBuffers||[t.vertexBuffer];else{var r=new n(t.vertices);this.vertexBuffers=[new i(r)]}return t.indexBuffer?this.indexBuffer=t.indexBuffer:t.indices&&(this.indexBuffer=new o(t.indices)),this.options={mode:e.mode,offset:e.offset,count:e.count},this}var n=t("../core/VertexPackage"),i=t("../core/VertexBuffer"),o=t("../core/IndexBuffer");r.prototype.draw=function(t){var e=t||{};return e.mode=e.mode||this.options.mode,e.offset=void 0!==e.offset?e.offset:this.options.offset,e.count=void 0!==e.count?e.count:this.options.count,this.indexBuffer?(this.vertexBuffers.forEach(function(t){t.bind()}),this.indexBuffer.bind(),this.indexBuffer.draw(e)):this.vertexBuffers.forEach(function(t){t.bind(),t.draw(e)}),this},e.exports=r}()},{"../core/IndexBuffer":2,"../core/VertexBuffer":9,"../core/VertexPackage":10}],5:[function(t,e,r){!function(){"use strict";function r(t,e){var r,n,i=d.parseDeclarations([t,e],["uniform","attribute"]),o={},s={},a=0;for(n=0;n<i.length;n++)r=i[n],"attribute"===r.qualifier?o[r.name]={type:r.type,index:a++}:"uniform"===r.qualifier&&(s[r.name]={type:r.type,func:E[r.type]});return{attributes:o,uniforms:s}}function n(t,e,r){var n=t.createShader(t[r]);return t.shaderSource(n,e),t.compileShader(n),t.getShaderParameter(n,t.COMPILE_STATUS)?n:(console.error("An error occurred compiling the shaders: "+t.getShaderInfoLog(n)),null)}function i(t){var e,r=t.gl,n=t.attributes;for(e in n)n.hasOwnProperty(e)&&r.bindAttribLocation(t.program,n[e].index,e)}function o(t){var e,r,n=t.gl,i=t.uniforms;for(r in i)i.hasOwnProperty(r)&&(e=i[r],e.location=n.getUniformLocation(t.program,r))}function s(t){return function(e){m.load(t,{responseType:"text",success:e,error:function(t){console.error(t),e(null)}})}}function a(t){return function(e){e(t)}}function u(t){return function(e){var r=[];t=t||[],t=t instanceof Array?t:[t],t.forEach(function(t){d.isGLSL(t)?r.push(a(t)):r.push(s(t))}),g.async(r,function(t){e(t)})}}function f(t){x!==t&&(t.gl.useProgram(t.program),x=t)}function h(t){null!==x&&(t.gl.useProgram(null),x=null)}function c(t){return t.program=null,t.attributes=null,t.uniforms=null,t}function l(t,e){var r=this;t=t||{},this.program=0,this.gl=p.get(),this.version=t.version||"1.00",t.vert||console.error("Vertex shader argument has not been provided, shader initialization aborted."),t.frag||console.error("Fragment shader argument has not been provided, shader initialization aborted."),g.async({common:u(t.common),vert:u(t.vert),frag:u(t.frag)},function(t){r.create(t),e&&e(r)})}var p=t("./WebGLContext"),d=t("./ShaderParser"),g=t("../util/Util"),m=t("../util/XHRLoader"),v=t("../util/Stack"),E={bool:"uniform1i","float":"uniform1f","int":"uniform1i",uint:"unfirom1i",vec2:"uniform2fv",ivec2:"uniform2iv",vec3:"uniform3fv",ivec3:"uniform3iv",vec4:"uniform4fv",ivec4:"uniform4iv",mat2:"uniformMatrix2fv",mat3:"uniformMatrix3fv",mat4:"uniformMatrix4fv",sampler2D:"uniform1i",samplerCube:"uniform1i"},y=new v,x=null;l.prototype.create=function(t){var e,s,a,u=this.gl,f=t.common.join(""),h=t.vert.join(""),l=t.frag.join("");return e=n(u,f+h,"VERTEX_SHADER"),s=n(u,f+l,"FRAGMENT_SHADER"),e&&s?(a=r(h,l),this.attributes=a.attributes,this.uniforms=a.uniforms,this.program=u.createProgram(),u.attachShader(this.program,e),u.attachShader(this.program,s),i(this),u.linkProgram(this.program),u.getProgramParameter(this.program,u.LINK_STATUS)?(o(this),this):(console.error("An error occured linking the shader: "+u.getProgramInfoLog(this.program)),console.error("Aborting instantiation of shader due to linking errors."),c(this))):(console.error("Aborting instantiation of shader due to compilation errors."),c(this))},l.prototype.push=function(){return y.push(this),f(this),this},l.prototype.pop=function(){var t;return y.pop(),t=y.top(),t?f(t):h(this),this},l.prototype.setUniform=function(t,e){if(!this.program)return void(this.hasLoggedError||(console.warn("Attempting to use an incomplete shader, command ignored."),this.hasLoggedError=!0));var r,n,i,o,s=this.uniforms[t];if(!s)return void console.warn('No uniform found under name "'+t+'", command ignored.');if(void 0===e)return void console.warn('Argument passed for uniform "'+t+'" is undefined, command ignored.');switch(r=s.func,n=s.type,i=s.location,o=e.toArray?e.toArray():e,o=o instanceof Array?new Float32Array(o):o,o="boolean"==typeof o?o?1:0:o,n){case"mat2":case"mat3":case"mat4":this.gl[r](i,!1,o);break;default:this.gl[r](i,o)}return this},e.exports=l}()},{"../util/Stack":14,"../util/Util":15,"../util/XHRLoader":16,"./ShaderParser":6,"./WebGLContext":12}],6:[function(t,e,r){!function(){"use strict";function t(t){return t.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm,"")}function r(t){return t.replace(/(\r\n|\n|\r)/gm,"").replace(/\s{2,}/g," ")}function n(t){function e(t){var e=t.split(/[\[\]]/).map(function(t){return t.trim()});return{qualifier:i,precision:o,type:a,name:e[0],count:void 0===e[1]?1:parseInt(e[1],10)}}var r,n,i,o,a,u,f,h=[];for(r=t.split(",").map(function(t){return t.trim()}),n=r.shift().split(" "),i=n.shift(),o=n.shift(),s[o]?a=n.shift():(a=o,o=null),u=n.concat(r),f=0;f<u.length;f++)h.push(e(u[f]));return h}function i(e,i){var o,s,a=i instanceof Array?i.join("|"):i,u=new RegExp("^.*\\b("+a+")\\b.*","gm"),f=t(e),h=r(f),c=h.split(";"),l=[];for(s=0;s<c.length;s++)o=c[s].trim().match(u),o&&(l=l.concat(n(o[0])));return l}function o(t){var e={};return t.filter(function(t){return e[t.name]?!1:(e[t.name]=!0,!0)})}var s={highp:!0,mediump:!0,lowp:!0};e.exports={parseDeclarations:function(t,e){if(!e||0===e.length)return[];var r,n=t instanceof Array?t:[t],s=[];for(r=0;r<n.length;r++)s=s.concat(i(n[r],e));return o(s)},isGLSL:function(t){return/void\s+main\s*\(\s*\)\s*/.test(t)}}}()},{}],7:[function(t,e,r){!function(){"use strict";function r(t){if(!a.isPowerOfTwo(t.width)||!a.isPowerOfTwo(t.height)){var e=document.createElement("canvas");e.width=a.nextHighestPowerOfTwo(t.width),e.height=a.nextHighestPowerOfTwo(t.height);var r=e.getContext("2d");return r.drawImage(t,0,0,t.width,t.height,0,0,e.width,e.height),e}return t}function n(t,e){if(h!==t){var r=t.gl;e=r["TEXTURE"+e]||r.TEXTURE0,r.activeTexture(e),r.bindTexture(r.TEXTURE_2D,t.texture),h=t}}function i(t){if(null!==h){var e=t.gl;e.bindTexture(e.TEXTURE_2D,null),h=null}}function o(t,e){var r=this;if(t=t||{},this.gl=s.get(),this.texture=this.gl.createTexture(),this.wrap=t.wrap||"REPEAT",this.filter=t.filter||"LINEAR",this.invertY=void 0!==t.invertY?t.invertY:!0,t.image)this.bufferData(t.image),this.setParameters(this);else if(t.url){var n=new Image;n.onload=function(){r.bufferData(n),r.setParameters(r),e(r)},n.src=t.url}else{if("DEPTH_COMPONENT"===t.format){var i=s.checkExtension("WEBGL_depth_texture");if(!i)return void console.log("Cannot create Texture2D of format gl.DEPTH_COMPONENT as WEBGL_depth_texture is unsupported by this browser, command ignored");this.format=t.format,t.type&&"UNSIGNED_SHORT"!==t.type&&"UNSIGNED_INT"!==t.type?(console.log("Depth textures do not support type'"+t.type+"', defaulting to 'UNSIGNED_SHORT'."),this.type="UNSIGNED_SHORT"):this.type=t.type}else this.format=t.format||"RGBA",this.type=t.type||"UNSIGNED_BYTE";this.internalFormat=this.format,this.mipMap=void 0!==t.mipMap?t.mipMap:!1,this.bufferData(t.data||null,t.width,t.height),this.setParameters(this)}}var s=t("./WebGLContext"),a=t("../util/Util"),u=t("../util/Stack"),f={},h=null;o.prototype.push=function(t){return f[t]=f[t]||new u,f[t].push(this),n(this,t),this},o.prototype.pop=function(t){var e;return f[t]||console.warn("No texture was bound to texture unit '"+t+"', command ignored."),f[t].pop(),e=f[t].top(),e?n(e,t):i(this),this},o.prototype.bufferData=function(t,e,n){var i=this.gl;return this.push(),t instanceof HTMLImageElement?(this.width=t.width,this.height=t.height,t=r(t),this.image=t,this.mipMap=!0,i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,this.invertY),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,i.RGBA,i.UNSIGNED_BYTE,t)):(this.data=t,this.width=e||this.width,this.height=n||this.height,i.texImage2D(i.TEXTURE_2D,0,i[this.internalFormat],this.width,this.height,0,i[this.format],i[this.type],this.data)),this.mipMap&&i.generateMipmap(i.TEXTURE_2D),this.pop(),this},o.prototype.setParameters=function(t){var e=this.gl;if(this.push(),t.wrap&&(this.wrap=t.wrap,e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e[this.wrap.s||this.wrap]),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e[this.wrap.t||this.wrap])),t.filter){this.filter=t.filter;var r=this.filter.min||this.filter;this.mipMap&&(r+="_MIPMAP_LINEAR"),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e[this.filter.mag||this.filter]),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e[r])}return this.pop(),this},o.prototype.resize=function(t,e){return this.image?void console.error("Cannot resize image based Texture2D"):t&&e?(this.bufferData(this.data,t,e),this):void console.warn("Width or height arguments missing, command ignored.")},e.exports=o}()},{"../util/Stack":14,"../util/Util":15,"./WebGLContext":12}],8:[function(t,e,r){!function(){"use strict";function r(t){if(!u.isPowerOfTwo(t.width)||!u.isPowerOfTwo(t.height)){var e=document.createElement("canvas");e.width=u.nextHighestPowerOfTwo(t.width),e.height=u.nextHighestPowerOfTwo(t.height);var r=e.getContext("2d");return r.drawImage(t,0,0,t.width,t.height,0,0,e.width,e.height),e}return t}function n(t,e){if(p!==t){var r=t.gl;e=r["TEXTURE"+e]||r.TEXTURE0,r.activeTexture(e),r.bindTexture(r.TEXTURE_CUBE_MAP,t.texture),p=t}}function i(t){if(null!==p){var e=t.gl;e.bindTexture(e.TEXTURE_CUBE_MAP,null),p=null}}function o(t,e,r){return function(n){var i=new Image;i.onload=function(){t.bufferFaceData(r,i),n()},i.src=e}}function s(t,e){var r,n,i=this;if(this.gl=a.get(),this.texture=this.gl.createTexture(),this.wrap=t.wrap||"CLAMP_TO_EDGE",this.filter=t.filter||"LINEAR",this.invertY=void 0!==t.invertY?t.invertY:!1,t.images){for(r in t.images)t.images.hasOwnProperty(r)&&this.bufferFaceData(r,t.images[r]);this.setParameters(this)}else if(t.urls){n={};for(r in t.urls)t.urls.hasOwnProperty(r)&&(n[r]=o(this,t.urls[r],r));u.async(n,function(){i.setParameters(i),e(i)})}else this.format=t.format||"RGBA",this.internalFormat=this.format,this.type=t.type||"UNSIGNED_BYTE",this.mipMap=void 0!==t.mipMap?t.mipMap:!1,h.forEach(function(e){var r=(t.data?t.data[e]:t.data)||null;i.bufferFaceData(e,r,t.width,t.height)}),this.setParameters(this)}var a=t("./WebGLContext"),u=t("../util/Util"),f=t("../util/Stack"),h=["-x","+x","-y","+y","-z","+z"],c={"+z":"TEXTURE_CUBE_MAP_POSITIVE_Z","-z":"TEXTURE_CUBE_MAP_NEGATIVE_Z","+x":"TEXTURE_CUBE_MAP_POSITIVE_X","-x":"TEXTURE_CUBE_MAP_NEGATIVE_X","+y":"TEXTURE_CUBE_MAP_POSITIVE_Y","-y":"TEXTURE_CUBE_MAP_NEGATIVE_Y"},l={},p=null;s.prototype.push=function(t){return l[t]=l[t]||new f,l[t].push(this),n(this,t),this},s.prototype.pop=function(t){var e;return l[t]||console.log("No texture was bound to texture unit '"+t+"', command ignored."),l[t].pop(),e=l[t].top(),e?n(e,t):i(this),this},s.prototype.bufferFaceData=function(t,e,n,i){var o=this.gl,s=o[c[t]];return s||console.log("Invalid face enumeration '"+t+"' provided, command ignored."),this.push(),e instanceof HTMLImageElement?(this.images=this.images||{},this.images[t]=r(e),this.filter="LINEAR",this.mipMap=!0,o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,this.invertY),o.texImage2D(s,0,o.RGBA,o.RGBA,o.UNSIGNED_BYTE,this.images[t])):(this.data=this.data||{},this.data[t]=e,this.width=n||this.width,this.height=i||this.height,o.texImage2D(s,0,o[this.internalFormat],this.width,this.height,0,o[this.format],o[this.type],e)),this.bufferedFaces=this.bufferedFaces||{},this.bufferedFaces[t]=!0,this.mipMap&&this.bufferedFaces["-x"]&&this.bufferedFaces["+x"]&&this.bufferedFaces["-y"]&&this.bufferedFaces["+y"]&&this.bufferedFaces["-z"]&&this.bufferedFaces["+z"]&&o.generateMipmap(o.TEXTURE_CUBE_MAP),this.pop(),this},s.prototype.setParameters=function(t){var e=this.gl;if(this.push(),t.wrap&&(this.wrap=t.wrap,e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_WRAP_S,e[this.wrap.s||this.wrap]),e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_WRAP_T,e[this.wrap.t||this.wrap])),t.filter){this.filter=t.filter;var r=this.filter.min||this.filter;this.minMap&&(r+="_MIPMAP_LINEAR"),e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAG_FILTER,e[this.filter.mag||this.filter]),e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MIN_FILTER,e[r])}return this.pop(),this},e.exports=s}()},{"../util/Stack":14,"../util/Util":15,"./WebGLContext":12}],9:[function(t,e,r){!function(){"use strict";function r(t){var e=4,r=0,n=0;return Object.keys(t).forEach(function(i){var o=t[i],s=o.offset;s>r&&(r=s,n=s+o.size*e)}),n}function n(t){if(!t||0===Object.keys(t).length)return console.warning("VertexBuffer requires attribute pointers to be specified upon instantiation, this buffer will not draw correctly."),{};var e={};return Object.keys(t).forEach(function(r){var n=parseInt(r,10);if(isNaN(n))return void console.warn("Attribute index '"+r+"' does not represent an integer, discarding attribute pointer.");var i=t[r],o=i.size,s=i.type,a=i.offset;(!o||1>o||o>4)&&(console.warn("Attribute pointer 'size' parameter is invalid, defaulting to 4."),o=4),s&&"FLOAT"===s||(console.warn("Attribute pointer 'type' parameter is invalid, defaulting to 'FLOAT'."),s="FLOAT"),e[n]={size:o,type:s,offset:void 0!==a?a:0}}),e}function i(t,e,i){i=i||{},this.buffer=0,this.gl=o.get(),t&&(t instanceof s?(this.bufferData(t.buffer()),i=e||{},e=t.attributePointers()):t instanceof WebGLBuffer?(this.buffer=t,this.count=void 0!==i.count?i.count:0):this.bufferData(t)),this.pointers=n(e),this.stride=r(this.pointers),this.offset=void 0!==i.offset?i.offset:0,this.mode=void 0!==i.mode?i.mode:"TRIANGLES"}var o=t("./WebGLContext"),s=t("./VertexPackage"),a=t("../util/Util"),u=null,f=null;i.prototype.bufferData=function(t){var e=this.gl;if(t instanceof Array)t=new Float32Array(t);else if(!a.isTypedArray(t)&&"number"!=typeof t)return void console.error("VertexBuffer requires an Array or ArrayBuffer, or a size argument, command ignored.");this.buffer||(this.buffer=e.createBuffer()),e.bindBuffer(e.ARRAY_BUFFER,this.buffer),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW)},i.prototype.bufferSubData=function(t,e){var r=this.gl;if(!this.buffer)return void console.error("VertexBuffer has not been initially buffered, command ignored.");if(t instanceof Array)t=new Float32Array(t);else if(!a.isTypedArray(t))return void console.error("VertexBuffer requires an Array or ArrayBuffer argument, command ignored.");e=void 0!==e?e:0,r.bindBuffer(r.ARRAY_BUFFER,this.buffer),r.bufferSubData(r.ARRAY_BUFFER,e,t)},i.prototype.bind=function(){if(u!==this){var t,e,r=this.gl,n=this.pointers,i=f||{};u=this,f={},r.bindBuffer(r.ARRAY_BUFFER,this.buffer);for(e in n)n.hasOwnProperty(e)&&(t=this.pointers[e],r.vertexAttribPointer(e,t.size,r[t.type],!1,this.stride,t.offset),r.enableVertexAttribArray(e),f[e]=!0,delete i[e]);for(e in i)i.hasOwnProperty(e)&&r.disableVertexAttribArray(e)}},i.prototype.draw=function(t){if(t=t||{},null===u)return void console.warn("No VertexBuffer is bound, command ignored.");var e=this.gl,r=e[t.mode||this.mode||"TRIANGLES"],n=void 0!==t.offset?t.offset:this.offset,i=void 0!==t.count?t.count:this.count;e.drawArrays(r,n,i)},i.prototype.unbind=function(){if(null!==u){var t,e=this.gl,r=this.pointers;for(t in r)r.hasOwnProperty(t)&&e.disableVertexAttribArray(t);e.bindBuffer(e.ARRAY_BUFFER,null),u=null,f={}}},e.exports=i}()},{"../util/Util":15,"./VertexPackage":10,"./WebGLContext":12}],10:[function(t,e,r){!function(){"use strict";function t(t){var e=[];return Object.keys(t).forEach(function(r){var n=parseInt(r,10);if(isNaN(n))return void console.warn("Attribute index '"+r+"' does not represent an integer, discarding attribute pointer.");var i=t[r];i&&i instanceof Array&&i.length>0?e.push({index:n,data:i}):console.warn("Error parsing attribute of index '"+r+"', attribute discarded.")}),e.sort(function(t,e){return t.index-e.index}),e}function r(t){return void 0!==t.x?void 0!==t.y?void 0!==t.z?void 0!==t.w?4:3:2:1:t instanceof Array?t.length:1}function n(t,e){var n=Number.MAX_VALUE,i=0;t.pointers={},e.forEach(function(e){var a=r(e.data[0]);n=Math.min(n,e.data.length),t.pointers[e.index]={type:o,size:a,offset:i*s},i+=a}),t.stride=i*s,t.length=n}function i(t){return void 0!==t?this.set(t):(this.data=new Float32Array(0),void(this.pointers={}))}var o="FLOAT",s=4;i.prototype.set=function(e){var r=this,i=t(e);return n(this,i),this.data=new Float32Array(this.length*(this.stride/s)),i.forEach(function(t){var e,n,i,o=r.pointers[t.index],a=o.offset/s,u=r.stride/s;for(n=0;n<r.length;n++)switch(e=t.data[n],i=a+u*n,o.size){case 2:r.data[i]=void 0!==e.x?e.x:e[0],r.data[i+1]=void 0!==e.y?e.y:e[1];break;case 3:r.data[i]=void 0!==e.x?e.x:e[0],r.data[i+1]=void 0!==e.y?e.y:e[1],r.data[i+2]=void 0!==e.z?e.z:e[2];break;case 4:r.data[i]=void 0!==e.x?e.x:e[0],r.data[i+1]=void 0!==e.y?e.y:e[1],r.data[i+2]=void 0!==e.z?e.z:e[2],r.data[i+3]=void 0!==e.w?e.w:e[3];break;default:void 0!==e.x?r.data[i]=e.x:void 0!==e[0]?r.data[i]=e[0]:r.data[i]=e}}),this},i.prototype.buffer=function(){return this.data},i.prototype.attributePointers=function(){return this.pointers},e.exports=i}()},{}],11:[function(t,e,r){!function(){"use strict";function r(t,e,r,n,i){var o=t.gl;e=void 0!==e?e:t.x,r=void 0!==r?r:t.y,n=void 0!==n?n:t.width,i=void 0!==i?i:t.height,o.viewport(e,r,n,i)}function n(t){t=t||{},this.gl=i.get(),this.resize(t.width||this.gl.canvas.height,t.height||this.gl.canvas.width),this.offset(t.x,t.y)}var i=t("./WebGLContext"),o=t("../util/Stack"),s=new o;n.prototype.resize=function(t,e){return void 0!==t&&void 0!==e&&(this.width=t,this.height=e,this.gl.canvas.height=e,this.gl.canvas.width=t),this},n.prototype.offset=function(t,e){return void 0!==t&&void 0!==e&&(this.x=t,this.y=e),this},n.prototype.push=function(t,e,n,i){return s.push({viewport:this,x:t,y:e,width:n,height:i}),r(this,t,e,n,i),this},n.prototype.pop=function(){var t;return s.pop(),t=s.top(),t?r(t.viewport,t.x,t.y,t.width,t.height):r(this),this},e.exports=n}()},{"../util/Stack":14,"./WebGLContext":12}],12:[function(t,e,r){!function(){"use strict";function t(t){return t instanceof HTMLImageElement||t instanceof HTMLCanvasElement?t:"string"==typeof t?document.getElementById(t):null}function r(e){if(e){var r=t(e);if(r)return s[r.id]}else if(o)return o;return null}function n(t){var e,r,n=t.gl;for(r=0;r<a.length;r++)e=a[r],t.extensions[e]=n.getExtension(e)}function i(t,e){var r,i;try{i=t.getContext("webgl",e)||t.getContext("experimental-webgl",e),r={id:t.id,gl:i,extensions:{}},n(r),s[t.id]=r,o=r}catch(a){console.error(a.message)}return i||console.error("Unable to initialize WebGL. Your browser may not support it."),r}var o=null,s={},a=["OES_texture_float","OES_texture_half_float","WEBGL_lose_context","OES_standard_derivatives","OES_vertex_array_object","WEBGL_debug_renderer_info","WEBGL_debug_shaders","WEBGL_compressed_texture_s3tc","WEBGL_depth_texture","OES_element_index_uint","EXT_texture_filter_anisotropic","WEBGL_draw_buffers","ANGLE_instanced_arrays","OES_texture_float_linear","OES_texture_half_float_linear","WEBGL_compressed_texture_atc","WEBGL_compressed_texture_pvrtc","EXT_color_buffer_half_float","WEBGL_color_buffer_float","EXT_frag_depth","EXT_sRGB","WEBGL_compressed_texture_etc1","EXT_blend_minmax","EXT_shader_texture_lod"];e.exports={bind:function(t){var e=r(t);return e?(o=e,this):(console.error("No context exists for provided argument '"+t+"', command ignored."),this)},get:function(e,n){var o=r(e);if(o)return o.gl;var a=t(e);return a&&i(a,n)?s[a.id].gl:(console.error("Context could not be found or created for argument of type'"+typeof e+"', returning 'null'."),null)},supportedExtensions:function(t){var e=r(t);if(e){var n=e.extensions,i=[];for(var o in n)n.hasOwnProperty(o)&&n[o]&&i.push(o);return i}return console.error("No context is currently bound or was provided, returning an empty array."),[]},unsupportedExtensions:function(t){var e=r(t);if(e){var n=e.extensions,i=[];for(var o in n)n.hasOwnProperty(o)&&!n[o]&&i.push(o);return i}return console.error("No context is currently bound or was provided, returning an empty array."),[]},checkExtension:function(t,e){e||(e=t,t=null);var n=r(t);if(n){var i=n.extensions;return i[e]?i[e]:!1}return console.error("No context is currently bound or provided as argument, returning false."),!1}}}()},{}],13:[function(t,e,r){!function(){"use strict";e.exports={IndexBuffer:t("./core/IndexBuffer"),Renderable:t("./core/Renderable"),RenderTarget:t("./core/RenderTarget"),Shader:t("./core/Shader"),Texture2D:t("./core/Texture2D"),TextureCubeMap:t("./core/TextureCubeMap"),VertexBuffer:t("./core/VertexBuffer"),VertexPackage:t("./core/VertexPackage"),Viewport:t("./core/Viewport"),WebGLContext:t("./core/WebGLContext")}}()},{"./core/IndexBuffer":2,"./core/RenderTarget":3,"./core/Renderable":4,"./core/Shader":5,"./core/Texture2D":7,"./core/TextureCubeMap":8,"./core/VertexBuffer":9,"./core/VertexPackage":10,"./core/Viewport":11,"./core/WebGLContext":12}],14:[function(t,e,r){!function(){"use strict";function t(){this.data=[]}t.prototype.push=function(t){return this.data.push(t),this},t.prototype.pop=function(){return this.data.pop(),this},t.prototype.top=function(){var t=this.data.length-1;return 0>t?null:this.data[t]},e.exports=t}()},{}],15:[function(t,e,r){!function(){"use strict";function r(t){return function(e){t.resolve(e)}}function n(t,e){var n,i,o=[];for(i=0;i<t.length;i++)n=new s,o.push(n),t[i](r(n));a.apply(a,o).then(function(){var t=Array.prototype.slice.call(arguments,0);e(t)})}function i(t,e){var n,i,o=[],u=[];for(i in t)t.hasOwnProperty(i)&&(n=new s,u.push(n),o.push(i),t[i](r(n)));a.apply(a,u).done(function(){var t,r=Array.prototype.slice.call(arguments,0),n={};for(t=0;t<o.length;t++)n[o[t]]=r[t];e(n)})}var o=t("simply-deferred"),s=o.Deferred,a=o.when;e.exports={async:function(t,e){t instanceof Array?n(t,e):i(t,e)},isTypedArray:function(t){return t&&t.buffer instanceof ArrayBuffer&&void 0!==t.byteLength},isPowerOfTwo:function(t){return 0!==t?0===(t&t-1):!1},nextHighestPowerOfTwo:function(t){var e;for(0!==t&&(t-=1),e=1;32>e;e<<=1)t|=t>>e;return t+1}}}()},{"simply-deferred":1}],16:[function(t,e,r){!function(){"use strict";e.exports={load:function(t,e){var r=new XMLHttpRequest;r.open("GET",t,!0),r.responseType=e.responseType,r.addEventListener("load",function(){e.success&&e.success(this.response)}),e.progress&&r.addEventListener("progress",function(t){e.progress(t)}),e.error&&r.addEventListener("error",function(t){e.error(t)}),r.send()}}}()},{}]},{},[13])(13)});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
window.alfador = require('alfador');
window.esper = require('esper/build/esper.min.js');

},{"alfador":9,"esper/build/esper.min.js":10}]},{},[11]);
