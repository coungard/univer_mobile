package com.univer_mobile

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "univer_mobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. Since RN 0.88 the New Architecture is
   * always on, so [DefaultReactActivityDelegate] no longer takes a `fabricEnabled` flag (the
   * constructor with flags is deprecated and ignores it).
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName)
}
